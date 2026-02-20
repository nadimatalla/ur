import { Board } from '@/components/game/Board';
import { Dice } from '@/components/game/Dice';
import { EdgeScore } from '@/components/game/EdgeScore';
import { GameStageHUD } from '@/components/game/GameStageHUD';
import { PieceRail } from '@/components/game/PieceRail';
import { Modal } from '@/components/ui/Modal';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { hasNakamaConfig, isNakamaEnabled } from '@/config/nakama';
import { useGameLoop } from '@/hooks/useGameLoop';
import { PlayerColor } from '@/logic/types';
import { gameAudio } from '@/services/audio';
import { nakamaService } from '@/services/nakama';
import { useGameStore } from '@/store/useGameStore';
import {
  MatchOpCode,
  MoveRequestPayload,
  RollRequestPayload,
  decodePayload,
  encodePayload,
  isServerErrorPayload,
  isStateSnapshotPayload,
} from '@/shared/urMatchProtocol';
import { MatchData, MatchPresenceEvent, Socket } from '@heroiclabs/nakama-js';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

export default function GameRoom() {
  const { id, offline } = useLocalSearchParams<{ id?: string | string[]; offline?: string | string[] }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const matchId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);
  const offlineParam = useMemo(() => (Array.isArray(offline) ? offline[0] : offline), [offline]);
  const isOffline = useMemo(
    () =>
      offlineParam === '1' ||
      !isNakamaEnabled() ||
      !hasNakamaConfig() ||
      String(matchId ?? '').startsWith('local-'),
    [matchId, offlineParam],
  );

  const gameState = useGameStore((state) => state.gameState);
  const roll = useGameStore((state) => state.roll);
  const reset = useGameStore((state) => state.reset);
  const userId = useGameStore((state) => state.userId);
  const playerColor = useGameStore((state) => state.playerColor);
  const initGame = useGameStore((state) => state.initGame);
  const setMatchId = useGameStore((state) => state.setMatchId);
  const storedMatchId = useGameStore((state) => state.matchId);
  const matchToken = useGameStore((state) => state.matchToken);
  const serverRevision = useGameStore((state) => state.serverRevision);
  const applyServerSnapshot = useGameStore((state) => state.applyServerSnapshot);
  const setPlayerColor = useGameStore((state) => state.setPlayerColor);
  const setOnlineMode = useGameStore((state) => state.setOnlineMode);
  const updateMatchPresences = useGameStore((state) => state.updateMatchPresences);
  const setSocketState = useGameStore((state) => state.setSocketState);
  const setRollCommandSender = useGameStore((state) => state.setRollCommandSender);
  const setMoveCommandSender = useGameStore((state) => state.setMoveCommandSender);

  const hasAssignedColor = playerColor === 'light' || playerColor === 'dark';
  const effectiveMatchToken = storedMatchId === matchId ? matchToken : null;
  const isMyTurn = hasAssignedColor && gameState.currentTurn === playerColor;
  const canRoll = isMyTurn && gameState.phase === 'rolling';

  const [showWinModal, setShowWinModal] = React.useState(false);
  const [rollingVisual, setRollingVisual] = React.useState(false);
  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useGameLoop(isOffline);

  useEffect(() => {
    if (gameState.winner) {
      setShowWinModal(true);
    }
  }, [gameState.winner]);

  useEffect(() => {
    if (!matchId) return;
    if (isOffline || storedMatchId !== matchId) {
      initGame(matchId);
    }
    setMatchId(matchId);
  }, [initGame, isOffline, matchId, setMatchId, storedMatchId]);

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!matchId) return;
    if (isOffline) {
      setOnlineMode('offline');
      setPlayerColor('light');
      setSocketState('connected');
      return;
    }

    setOnlineMode('nakama');

    let isMounted = true;

    const handleMatchData = (matchData: MatchData) => {
      if (matchData.match_id !== matchId) return;

      let rawData = '';
      if (typeof matchData.data === 'string') {
        rawData = matchData.data;
      } else if (typeof TextDecoder !== 'undefined') {
        rawData = new TextDecoder().decode(matchData.data);
      } else {
        rawData = String.fromCharCode(...Array.from(matchData.data));
      }

      const payload = decodePayload(rawData);

      if (matchData.op_code === MatchOpCode.STATE_SNAPSHOT) {
        if (!isStateSnapshotPayload(payload)) {
          return;
        }
        const assignedColorFromSnapshot = userId
          ? (payload.assignments[userId] as PlayerColor | undefined)
          : undefined;
        console.info('[Nakama][snapshot]', {
          matchId: payload.matchId,
          revision: payload.revision,
          assignedPlayerColor: assignedColorFromSnapshot ?? null,
          phase: payload.gameState.phase,
          turn: payload.gameState.currentTurn,
          roll: payload.gameState.rollValue,
          lightFinished: payload.gameState.light.finishedCount,
          darkFinished: payload.gameState.dark.finishedCount,
        });
        applyServerSnapshot(payload.gameState, payload.revision, payload.matchId);
        if (userId) {
          const assignedColor = assignedColorFromSnapshot;
          if (assignedColor) {
            setPlayerColor(assignedColor);
          }
        }
        return;
      }

      if (matchData.op_code === MatchOpCode.SERVER_ERROR) {
        if (isServerErrorPayload(payload)) {
          console.warn('[Nakama][server_error]', {
            code: payload.code,
            message: payload.message,
            revision: payload.revision ?? null,
          });
        }
      }
    };

    const handleMatchPresence = (matchPresence: MatchPresenceEvent) => {
      if (matchPresence.match_id !== matchId) return;
      updateMatchPresences(matchPresence);
    };

    const attachSocketHandlers = (socket: Socket) => {
      socketRef.current = socket;
      socket.onmatchdata = handleMatchData;
      socket.onmatchpresence = handleMatchPresence;
      socket.ondisconnect = () => {
        nakamaService.disconnectSocket(false);
        setSocketState('disconnected');
        if (reconnectTimerRef.current) {
          return;
        }
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          void connectAndJoin();
        }, 1500);
      };
    };

    const connectAndJoin = async () => {
      try {
        setSocketState('connecting');
        const socket = await nakamaService.connectSocketWithRetry({
          attempts: 3,
          retryDelayMs: 1_000,
          createStatus: true,
        });
        attachSocketHandlers(socket);
        const match = effectiveMatchToken
          ? await socket.joinMatch(matchId, effectiveMatchToken)
          : await socket.joinMatch(matchId);
        if (!isMounted) return;
        setMatchId(match.match_id);
        setSocketState('connected');
      } catch (error) {
        console.error(error);
        setSocketState('error');
      }
    };

    void connectAndJoin();

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (!isOffline && socketRef.current && matchId) {
        void socketRef.current.leaveMatch(matchId).catch(() => {});
      }
      if (socketRef.current) {
        socketRef.current.onmatchdata = () => {};
        socketRef.current.onmatchpresence = () => {};
        socketRef.current.ondisconnect = () => {};
      }
    };
  }, [
    applyServerSnapshot,
    isOffline,
    matchId,
    effectiveMatchToken,
    setMatchId,
    setOnlineMode,
    setPlayerColor,
    setSocketState,
    updateMatchPresences,
    userId,
  ]);

  useEffect(() => {
    if (!matchId) return;
    if (isOffline) {
      setRollCommandSender(null);
      setMoveCommandSender(null);
      return;
    }

    const sendRoll = async () => {
      const socket = socketRef.current;
      if (!socket) return;
      const payload: RollRequestPayload = { type: 'roll_request' };
      console.info('[Nakama][send]', {
        eventType: payload.type,
        matchId,
        revision: serverRevision,
        payload,
      });
      await socket.sendMatchState(matchId, MatchOpCode.ROLL_REQUEST, encodePayload(payload));
    };

    const sendMove = async (move: { pieceId: string; fromIndex: number; toIndex: number }) => {
      const socket = socketRef.current;
      if (!socket) return;
      const payload: MoveRequestPayload = { type: 'move_request', move };
      console.info('[Nakama][send]', {
        eventType: payload.type,
        matchId,
        revision: serverRevision,
        payload,
      });
      await socket.sendMatchState(matchId, MatchOpCode.MOVE_REQUEST, encodePayload(payload));
    };

    setRollCommandSender(sendRoll);
    setMoveCommandSender(sendMove);

    return () => {
      setRollCommandSender(null);
      setMoveCommandSender(null);
    };
  }, [isOffline, matchId, serverRevision, setMoveCommandSender, setRollCommandSender]);

  useEffect(() => {
    return () => {
      if (rollTimerRef.current) {
        clearTimeout(rollTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    void gameAudio.start();

    return () => {
      void gameAudio.stopAll();
    };
  }, []);

  const previousStateRef = useRef(gameState);

  useEffect(() => {
    const previous = previousStateRef.current;

    if (previous.rollValue !== gameState.rollValue && gameState.rollValue !== null) {
      void gameAudio.play('roll');
    }

    if (gameState.history.length > previous.history.length) {
      const newEntries = gameState.history.slice(previous.history.length);
      for (const entry of newEntries) {
        if (entry.includes('captured')) {
          void gameAudio.play('capture');
        } else if (entry.includes('moved to')) {
          void gameAudio.play('move');
        }
      }
    }

    if (
      gameState.light.finishedCount > previous.light.finishedCount ||
      gameState.dark.finishedCount > previous.dark.finishedCount
    ) {
      void gameAudio.play('score');
    }

    if (!previous.winner && gameState.winner) {
      void gameAudio.play('win');
    }

    previousStateRef.current = gameState;
  }, [gameState]);

  const handleRoll = () => {
    if (!canRoll || rollingVisual) return;

    setRollingVisual(true);
    roll();
    if (rollTimerRef.current) {
      clearTimeout(rollTimerRef.current);
    }
    rollTimerRef.current = setTimeout(() => {
      setRollingVisual(false);
      rollTimerRef.current = null;
    }, 560);
  };

  const handleExit = () => {
    if (!isOffline && socketRef.current && matchId) {
      void socketRef.current.leaveMatch(matchId).catch(() => {});
      nakamaService.disconnectSocket(true);
    }
    setShowWinModal(false);
    reset();
    router.replace('/');
  };

  const recentHistory = gameState.history.slice(-5).reverse();
  const lightReserve = gameState.light.pieces.filter((piece) => !piece.isFinished && piece.position === -1).length;
  const darkReserve = gameState.dark.pieces.filter((piece) => !piece.isFinished && piece.position === -1).length;

  const isCompact = width < 720;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: `Game #${id}` }} />

      <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.tableGrainPrimary} />
      <Image source={urTextures.wood} resizeMode="repeat" style={styles.tableGrainSecondary} />
      <View style={styles.tableTopLight} />
      <View style={styles.tableBottomShade} />
      <View style={styles.tableVignetteOuter} />
      <View style={styles.tableVignetteInner} />
      <View style={styles.tableSoftSpot} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.stageWrap}>
          <View style={styles.scoreRow}>
            <EdgeScore label="Dark Score" value={`${gameState.dark.finishedCount}/7`} active={!isMyTurn} />
            <EdgeScore
              label="Light Score"
              value={`${gameState.light.finishedCount}/7`}
              active={isMyTurn}
              align="right"
            />
          </View>

          <PieceRail
            label="Dark Reserve"
            color="dark"
            tokenVariant="dark"
            reserveCount={darkReserve}
            active={!isMyTurn}
          />

          <GameStageHUD isMyTurn={isMyTurn} canRoll={canRoll} phase={gameState.phase} />

          <View style={styles.boardCard}>
            <View style={styles.boardShadow} />
            <Board showRailHints highlightMode="theatrical" boardScale={isCompact ? 0.95 : 1} />
          </View>

          <PieceRail
            label="Light Reserve"
            color="light"
            tokenVariant="light"
            reserveCount={lightReserve}
            active={isMyTurn}
          />

          <Dice
            value={gameState.rollValue}
            rolling={rollingVisual}
            onRoll={handleRoll}
            canRoll={canRoll}
            mode="stage"
          />

          {recentHistory.length > 0 && (
            <View style={styles.historyStrip}>
              <Text style={styles.historyTitle}>Recent</Text>
              {recentHistory.map((entry, index) => (
                <Text key={`${entry}-${index}`} style={styles.historyEntry}>
                  {entry}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showWinModal}
        title={gameState.winner === 'light' ? 'Victory' : 'Defeat'}
        message={gameState.winner === 'light' ? 'The royal path is yours.' : 'The opponent seized the final lane.'}
        actionLabel="Return to Menu"
        onAction={handleExit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: urTheme.colors.tableWalnut,
  },
  tableGrainPrimary: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  tableGrainSecondary: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
    transform: [{ rotate: '180deg' }],
  },
  tableTopLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(255, 213, 166, 0.16)',
  },
  tableBottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '54%',
    backgroundColor: 'rgba(12, 6, 4, 0.44)',
  },
  tableVignetteOuter: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(0, 0, 0, 0.24)',
    borderWidth: 24,
  },
  tableVignetteInner: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(0, 0, 0, 0.13)',
    borderWidth: 10,
  },
  tableSoftSpot: {
    position: 'absolute',
    top: '28%',
    left: '16%',
    width: '68%',
    height: '36%',
    borderRadius: urTheme.radii.lg,
    backgroundColor: 'rgba(255, 238, 211, 0.06)',
  },
  scrollContent: {
    paddingHorizontal: urTheme.spacing.md,
    paddingTop: urTheme.spacing.md,
    paddingBottom: urTheme.spacing.xl,
    alignItems: 'center',
  },
  stageWrap: {
    width: '100%',
    maxWidth: urTheme.layout.stage.maxWidth,
    gap: urTheme.spacing.md,
  },
  scoreRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  boardCard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 2,
    marginBottom: 2,
  },
  boardShadow: {
    position: 'absolute',
    width: '84%',
    height: 44,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    top: '52%',
    zIndex: 0,
  },
  historyStrip: {
    width: '100%',
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.44)',
    backgroundColor: 'rgba(9, 14, 20, 0.7)',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    overflow: 'hidden',
  },
  historyTitle: {
    ...urTypography.label,
    fontSize: 10,
    color: 'rgba(241, 230, 208, 0.72)',
    marginBottom: 6,
  },
  historyEntry: {
    color: 'rgba(244, 230, 206, 0.9)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
});

import { urShadows, urTheme, urTextures } from '@/constants/urTheme';
import { BOARD_COLS, BOARD_ROWS, PATH_DARK, PATH_LENGTH, PATH_LIGHT } from '@/logic/constants';
import { MoveAction } from '@/logic/types';
import { useGameStore } from '@/store/useGameStore';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Piece } from './Piece';
import { Tile } from './Tile';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface BoardProps {
  showRailHints?: boolean;
  highlightMode?: 'subtle' | 'theatrical';
  boardScale?: number;
}

interface Point {
  x: number;
  y: number;
}

const FRAME_PADDING = urTheme.spacing.sm;
const INNER_PADDING = urTheme.spacing.xs;
const GRID_GAP = Math.max(2, urTheme.spacing.xs - 2);
const CUE_SIZE = 48;

export const Board: React.FC<BoardProps> = ({
  showRailHints = false,
  highlightMode = 'theatrical',
  boardScale = 1,
}) => {
  const gameState = useGameStore((state) => state.gameState);
  const validMoves = useGameStore((state) => state.validMoves);
  const makeMove = useGameStore((state) => state.makeMove);
  const playerColor = useGameStore((state) => state.playerColor);
  const { width } = useWindowDimensions();
  const [selectedMove, setSelectedMove] = useState<MoveAction | null>(null);

  const cuePulse = useSharedValue(0);
  const previewPulse = useSharedValue(0);

  const boardWidth = useMemo(
    () => Math.min(width - urTheme.spacing.lg, urTheme.layout.boardMax) * boardScale,
    [boardScale, width],
  );

  const cellSize = useMemo(() => {
    const gridWidth = boardWidth - FRAME_PADDING * 2 - INNER_PADDING * 2;
    return gridWidth / BOARD_COLS;
  }, [boardWidth]);

  const mapIndexToCoord = (color: 'light' | 'dark', index: number, r: number, c: number) => {
    const path = color === 'light' ? PATH_LIGHT : PATH_DARK;
    const coord = path[index];
    if (!coord) return false;
    return coord.row === r && coord.col === c;
  };

  const getCellCenter = (r: number, c: number): Point => ({
    x: FRAME_PADDING + INNER_PADDING + c * cellSize + cellSize / 2,
    y: FRAME_PADDING + INNER_PADDING + r * (cellSize + GRID_GAP) + cellSize / 2,
  });

  const coordForPathIndex = (color: 'light' | 'dark', index: number): Point | null => {
    const path = color === 'light' ? PATH_LIGHT : PATH_DARK;

    if (index === -1) {
      const startCenter = getCellCenter(path[0].row, path[0].col);
      return {
        x: startCenter.x + cellSize * 0.58,
        y: startCenter.y,
      };
    }

    if (index === PATH_LENGTH) {
      const finalCenter = getCellCenter(path[path.length - 1].row, path[path.length - 1].col);
      return {
        x: finalCenter.x + cellSize * 0.95,
        y: finalCenter.y,
      };
    }

    const coord = path[index];
    if (!coord) return null;
    return getCellCenter(coord.row, coord.col);
  };

  const getPieceAt = (r: number, c: number): { id: string; color: 'light' | 'dark' } | undefined => {
    const lightPiece = gameState.light.pieces.find(
      (piece) =>
        !piece.isFinished && piece.position !== -1 && mapIndexToCoord('light', piece.position, r, c),
    );
    if (lightPiece) return { id: lightPiece.id, color: 'light' };

    const darkPiece = gameState.dark.pieces.find(
      (piece) => !piece.isFinished && piece.position !== -1 && mapIndexToCoord('dark', piece.position, r, c),
    );
    if (darkPiece) return { id: darkPiece.id, color: 'dark' };

    return undefined;
  };

  const assignedPlayerColor: 'light' | 'dark' | null = playerColor === 'light' || playerColor === 'dark'
    ? playerColor
    : null;

  const mapAssignedIndexToCoord = (index: number, r: number, c: number) =>
    assignedPlayerColor ? mapIndexToCoord(assignedPlayerColor, index, r, c) : false;

  const isMyTurn = assignedPlayerColor !== null && gameState.currentTurn === assignedPlayerColor;

  const spawnMove = useMemo(
    () => validMoves.find((move) => move.fromIndex === -1) ?? null,
    [validMoves],
  );

  const spawnCueColor: 'light' | 'dark' = gameState.currentTurn;

  const spawnCueAnchor = spawnMove
    ? (() => {
        const start = spawnCueColor === 'light' ? PATH_LIGHT[0] : PATH_DARK[0];
        const startCenter = getCellCenter(start.row, start.col);
        return {
          x: startCenter.x + cellSize * 0.58,
          y: startCenter.y,
        };
      })()
    : null;

  const previewPoints = (() => {
    if (!selectedMove) return [] as Point[];

    const color: 'light' | 'dark' = selectedMove.pieceId.startsWith('dark') ? 'dark' : 'light';
    const points: Point[] = [];

    if (selectedMove.fromIndex === -1) {
      const reservePoint = coordForPathIndex(color, -1);
      if (reservePoint) {
        points.push(reservePoint);
      }
      for (let index = 0; index <= Math.min(selectedMove.toIndex, PATH_LENGTH - 1); index += 1) {
        const point = coordForPathIndex(color, index);
        if (point) {
          points.push(point);
        }
      }
    } else {
      const startPoint = coordForPathIndex(color, selectedMove.fromIndex);
      if (startPoint) {
        points.push(startPoint);
      }
      for (
        let index = selectedMove.fromIndex + 1;
        index <= Math.min(selectedMove.toIndex, PATH_LENGTH - 1);
        index += 1
      ) {
        const point = coordForPathIndex(color, index);
        if (point) {
          points.push(point);
        }
      }
    }

    if (selectedMove.toIndex === PATH_LENGTH) {
      const finishPoint = coordForPathIndex(color, PATH_LENGTH);
      if (finishPoint) {
        points.push(finishPoint);
      }
    }

    return points;
  })();

  const previewSegments = useMemo(() => {
    const segments: { x: number; y: number; width: number; angle: number }[] = [];

    for (let index = 0; index < previewPoints.length - 1; index += 1) {
      const current = previewPoints[index];
      const next = previewPoints[index + 1];
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const width = Math.sqrt(dx * dx + dy * dy);

      segments.push({
        x: (current.x + next.x) / 2,
        y: (current.y + next.y) / 2,
        width,
        angle: Math.atan2(dy, dx),
      });
    }

    return segments;
  }, [previewPoints]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [gameState.history.length]);

  useEffect(() => {
    if (!spawnMove) {
      cancelAnimation(cuePulse);
      cuePulse.value = withTiming(0, { duration: urTheme.motion.duration.fast });
      return;
    }

    cuePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 760, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.2, { duration: 760, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [cuePulse, spawnMove]);

  useEffect(() => {
    if (!selectedMove) {
      cancelAnimation(previewPulse);
      previewPulse.value = withTiming(0, { duration: urTheme.motion.duration.fast });
      return;
    }

    previewPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 620, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.4, { duration: 620, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [previewPulse, selectedMove]);

  useEffect(() => {
    if (!selectedMove) return;

    const stillValid = validMoves.some(
      (move) =>
        move.pieceId === selectedMove.pieceId &&
        move.fromIndex === selectedMove.fromIndex &&
        move.toIndex === selectedMove.toIndex,
    );

    if (!stillValid) {
      setSelectedMove(null);
    }
  }, [selectedMove, validMoves]);

  useEffect(() => {
    setSelectedMove(null);
  }, [gameState.currentTurn, gameState.phase, gameState.rollValue]);

  const executeMove = (move: MoveAction) => {
    console.info('[Board][executeMove]', {
      pieceId: move.pieceId,
      fromIndex: move.fromIndex,
      toIndex: move.toIndex,
      phase: gameState.phase,
      turn: gameState.currentTurn,
      playerColor: assignedPlayerColor,
    });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    makeMove(move);
    setSelectedMove(null);
  };

  const handleSpawnCuePress = () => {
    if (!spawnMove || !isMyTurn || gameState.phase !== 'moving') return;

    if (
      selectedMove &&
      selectedMove.pieceId === spawnMove.pieceId &&
      selectedMove.fromIndex === spawnMove.fromIndex &&
      selectedMove.toIndex === spawnMove.toIndex
    ) {
      executeMove(spawnMove);
      return;
    }

    setSelectedMove(spawnMove);
  };

  const handleTilePress = (r: number, c: number) => {
    if (!assignedPlayerColor || !isMyTurn || gameState.phase !== 'moving') return;

    const moveFromTile = validMoves.find(
      (move) => move.fromIndex >= 0 && mapAssignedIndexToCoord(move.fromIndex, r, c),
    );

    if (moveFromTile) {
      if (
        selectedMove &&
        selectedMove.pieceId === moveFromTile.pieceId &&
        selectedMove.fromIndex === moveFromTile.fromIndex &&
        selectedMove.toIndex === moveFromTile.toIndex
      ) {
        if (moveFromTile.toIndex === PATH_LENGTH) {
          executeMove(moveFromTile);
        } else {
          setSelectedMove(null);
        }
      } else {
        setSelectedMove(moveFromTile);
      }
      return;
    }

    if (selectedMove) {
      const selectedToTileMatch =
        selectedMove.toIndex !== PATH_LENGTH && mapAssignedIndexToCoord(selectedMove.toIndex, r, c);
      const selectedScoreMatch =
        selectedMove.toIndex === PATH_LENGTH && mapAssignedIndexToCoord(selectedMove.fromIndex, r, c);

      if (selectedToTileMatch || selectedScoreMatch) {
        executeMove(selectedMove);
        return;
      }
    }

    const scoringMove = validMoves.find((move) => {
      if (move.toIndex !== PATH_LENGTH) return false;
      return move.fromIndex >= 0 && mapAssignedIndexToCoord(move.fromIndex, r, c);
    });

    if (scoringMove) {
      executeMove(scoringMove);
      return;
    }

    const moveToTile = validMoves.find(
      (move) => move.toIndex !== PATH_LENGTH && mapAssignedIndexToCoord(move.toIndex, r, c),
    );

    if (moveToTile) {
      executeMove(moveToTile);
      return;
    }

    setSelectedMove(null);
  };

  const cueAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + cuePulse.value * 0.7,
    transform: [{ scale: 0.94 + cuePulse.value * 0.14 }],
  }));

  const previewPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + previewPulse.value * 0.64,
    shadowOpacity: 0.26 + previewPulse.value * 0.5,
  }));

  const renderGrid = () => {
    const rows = [];

    for (let r = 0; r < BOARD_ROWS; r += 1) {
      const rowCells = [];

      for (let c = 0; c < BOARD_COLS; c += 1) {
        const isGap = (r === 0 || r === 2) && (c === 4 || c === 5);
        if (isGap) {
          rowCells.push(<View key={`${r}-${c}`} style={styles.gapCell} />);
          continue;
        }

        const piece = getPieceAt(r, c);
        const moveFromTile = validMoves.find(
          (move) => move.fromIndex >= 0 && isMyTurn && mapAssignedIndexToCoord(move.fromIndex, r, c),
        );

        const isScoreOrigin =
          isMyTurn &&
          validMoves.some(
            (move) => move.toIndex === PATH_LENGTH && move.fromIndex >= 0 && mapAssignedIndexToCoord(move.fromIndex, r, c),
          );

        const isDestination =
          isMyTurn &&
          validMoves.some(
            (move) => move.toIndex !== PATH_LENGTH && mapAssignedIndexToCoord(move.toIndex, r, c),
          );

        const isSelectedDestination =
          !!selectedMove &&
          selectedMove.toIndex !== PATH_LENGTH &&
          mapAssignedIndexToCoord(selectedMove.toIndex, r, c);

        const isSelectedPiece =
          !!selectedMove && selectedMove.fromIndex >= 0 && mapAssignedIndexToCoord(selectedMove.fromIndex, r, c);

        const isValidTarget = isSelectedDestination || isScoreOrigin || isDestination;
        const isInteractable = isMyTurn && (isValidTarget || !!moveFromTile || isSelectedPiece);

        rowCells.push(
          <View key={`${r}-${c}`} style={styles.cellShell}>
            <Tile
              row={r}
              col={c}
              piece={piece}
              isValidTarget={isValidTarget}
              isSelectedPiece={isSelectedPiece}
              isInteractive={isInteractable}
              highlightMode={highlightMode}
              onPress={() => handleTilePress(r, c)}
            />
          </View>,
        );
      }

      rows.push(
        <View key={r} style={styles.row}>
          {rowCells}
        </View>,
      );
    }

    return rows;
  };

  const spawnCueSelected =
    !!spawnMove &&
    !!selectedMove &&
    spawnMove.pieceId === selectedMove.pieceId &&
    spawnMove.fromIndex === selectedMove.fromIndex &&
    spawnMove.toIndex === selectedMove.toIndex;

  return (
    <View style={[styles.frame, urShadows.deep, { width: boardWidth }]}> 
      <Image source={urTextures.border} resizeMode="repeat" style={styles.frameBorderTexture} />
      <View style={styles.frameRimOuter} />
      <View style={styles.frameRimInner} />

      <View style={styles.innerFrame}>
        <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.boardTexture} />
        <View style={styles.topGlow} />
        <View style={styles.bottomShade} />
        <View style={styles.innerStroke} />
        <View style={styles.gridWrap}>{renderGrid()}</View>
      </View>

      {previewSegments.length > 0 && (
        <View pointerEvents="none" style={styles.previewLayer}>
          {previewSegments.map((segment, index) => (
            <Animated.View
              key={`segment-${index}`}
              style={[
                styles.previewSegment,
                {
                  left: segment.x - segment.width / 2,
                  top: segment.y - 3,
                  width: segment.width,
                  transform: [{ rotateZ: `${segment.angle}rad` }],
                },
                previewPulseStyle,
              ]}
            />
          ))}
          {previewPoints.map((point, index) => (
            <Animated.View
              key={`point-${index}`}
              style={[
                styles.previewPoint,
                {
                  left: point.x - 7,
                  top: point.y - 7,
                },
                previewPulseStyle,
              ]}
            />
          ))}
        </View>
      )}

      {spawnCueAnchor && (
        <Pressable
          onPress={handleSpawnCuePress}
          disabled={!isMyTurn}
          style={[
            styles.spawnCueTouchable,
            {
              left: spawnCueAnchor.x - CUE_SIZE / 2,
              top: spawnCueAnchor.y - CUE_SIZE / 2,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.spawnCue,
              spawnCueSelected && styles.spawnCueSelected,
              !isMyTurn && styles.spawnCueReadonly,
              cueAnimatedStyle,
            ]}
          >
            <View style={styles.spawnCueInner}>
              <Piece
                color={spawnCueColor}
                size="sm"
                variant={spawnCueColor}
                highlight={spawnCueSelected}
                state={spawnCueSelected ? 'active' : 'idle'}
              />
            </View>
          </Animated.View>
        </Pressable>
      )}

      {showRailHints && (
        <View pointerEvents="none" style={styles.hintRow}>
          <Text style={styles.hintText}>START</Text>
          <Text style={styles.hintText}>FINISH</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    borderRadius: urTheme.radii.lg + 6,
    padding: FRAME_PADDING,
    backgroundColor: '#3A2012',
    borderWidth: 2,
    borderColor: 'rgba(217, 164, 65, 0.52)',
    overflow: 'hidden',
  },
  frameBorderTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  frameRimOuter: {
    ...StyleSheet.absoluteFillObject,
    margin: 2,
    borderRadius: urTheme.radii.lg + 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 228, 174, 0.2)',
  },
  frameRimInner: {
    ...StyleSheet.absoluteFillObject,
    margin: 7,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(65, 34, 15, 0.62)',
  },
  innerFrame: {
    borderRadius: urTheme.radii.lg,
    overflow: 'hidden',
    backgroundColor: '#54301A',
    padding: INNER_PADDING,
  },
  boardTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(255, 220, 150, 0.16)',
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '46%',
    backgroundColor: 'rgba(8, 8, 8, 0.26)',
  },
  innerStroke: {
    ...StyleSheet.absoluteFillObject,
    margin: INNER_PADDING,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 226, 175, 0.22)',
  },
  gridWrap: {
    gap: GRID_GAP,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  cellShell: {
    width: `${100 / BOARD_COLS}%`,
    aspectRatio: 1,
    padding: 3,
  },
  gapCell: {
    width: `${100 / BOARD_COLS}%`,
    aspectRatio: 1,
    padding: 3,
  },
  previewLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  previewSegment: {
    position: 'absolute',
    height: 6,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(111, 184, 255, 0.95)',
    shadowColor: urTheme.colors.glow,
    shadowRadius: 7,
    elevation: 6,
  },
  previewPoint: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(241, 230, 208, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(63, 40, 18, 0.48)',
    shadowColor: urTheme.colors.glow,
    shadowRadius: 8,
    elevation: 6,
  },
  spawnCueTouchable: {
    position: 'absolute',
    width: CUE_SIZE,
    height: CUE_SIZE,
    borderRadius: urTheme.radii.pill,
  },
  spawnCue: {
    flex: 1,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(111, 184, 255, 0.84)',
    backgroundColor: 'rgba(11, 24, 37, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: urTheme.colors.glow,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 7,
  },
  spawnCueReadonly: {
    borderColor: 'rgba(206, 172, 112, 0.58)',
    backgroundColor: 'rgba(40, 31, 19, 0.76)',
  },
  spawnCueSelected: {
    borderColor: 'rgba(245, 214, 149, 0.95)',
    shadowColor: '#F5D695',
  },
  spawnCueInner: {
    width: 42,
    height: 42,
    borderRadius: urTheme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 27, 39, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 229, 183, 0.28)',
  },
  hintRow: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hintText: {
    color: 'rgba(248, 229, 198, 0.85)',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
  },
});

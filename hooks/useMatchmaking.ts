import { hasNakamaConfig, isNakamaEnabled } from '@/config/nakama';
import { cancelMatchmaking, findMatch } from '@/services/matchmaking';
import { nakamaService } from '@/services/nakama';
import { useGameStore } from '@/store/useGameStore';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

export type LobbyMode = 'bot' | 'online';

export const useMatchmaking = (mode: LobbyMode = 'bot') => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'searching' | 'matched' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [onlineCount, setOnlineCount] = useState<number | null>(null);
    const initGame = useGameStore(state => state.initGame);
    const setMatchId = useGameStore(state => state.setMatchId);
    const setNakamaSession = useGameStore(state => state.setNakamaSession);
    const setUserId = useGameStore(state => state.setUserId);
    const setMatchToken = useGameStore(state => state.setMatchToken);
    const setSocketState = useGameStore(state => state.setSocketState);
    const setOnlineMode = useGameStore(state => state.setOnlineMode);
    const setPlayerColor = useGameStore(state => state.setPlayerColor);
    const router = useRouter();
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Poll for online player count when in online mode
    useEffect(() => {
        if (mode !== 'online' || !isNakamaEnabled() || !hasNakamaConfig()) return;

        let cancelled = false;

        const fetchOnlineCount = async () => {
            try {
                const session = await nakamaService.ensureAuthenticatedDevice();
                const client = nakamaService.getClient();
                if (!client || cancelled) return;

                // Use Nakama's matchmaker status or list matches to estimate online count
                // We'll count active matches and presences as a proxy
                const result = await client.listMatches(session, 100, true, '', 0, 2);
                if (!cancelled) {
                    // Each match with 1 player means someone is waiting; with 0 means empty
                    // Players not in matches but connected aren't tracked this way,
                    // so we'll track total players across all active matches
                    let totalPlayers = 0;
                    if (result.matches) {
                        for (const match of result.matches) {
                            totalPlayers += match.size || 0;
                        }
                    }
                    setOnlineCount(totalPlayers);
                }
            } catch {
                // Silently fail — count is cosmetic
                if (!cancelled) setOnlineCount(null);
            }
        };

        void fetchOnlineCount();
        pollingRef.current = setInterval(fetchOnlineCount, 5000);

        return () => {
            cancelled = true;
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [mode]);

    useEffect(() => {
        return () => {
            void cancelMatchmaking();
        };
    }, []);

    const startBotGame = useCallback(() => {
        setOnlineMode('offline');
        const localMatchId = `local-${Date.now()}`;
        setMatchToken(null);
        setMatchId(localMatchId);
        initGame(localMatchId);
        setSocketState('connected');
        setStatus('matched');
        router.push(`/match/${localMatchId}?offline=1`);
    }, [initGame, router, setMatchId, setMatchToken, setOnlineMode, setSocketState]);

    const startOnlineMatch = useCallback(async () => {
        setErrorMessage(null);
        setStatus('connecting');
        setSocketState('connecting');
        setPlayerColor(null);

        try {
            await cancelMatchmaking();

            if (!isNakamaEnabled() || !hasNakamaConfig()) {
                setErrorMessage('Online multiplayer is not configured. Please check your Nakama settings.');
                setStatus('error');
                setSocketState('error');
                return;
            }

            setOnlineMode('nakama');
            const result = await findMatch({
                onSearching: () => setStatus('searching')
            });
            setNakamaSession(result.session);
            setUserId(result.userId);
            setMatchToken(result.matchToken);
            setMatchId(result.matchId);
            initGame(result.matchId);
            setPlayerColor(result.playerColor);
            setSocketState('connected');
            setStatus('matched');
            router.push(`/match/${result.matchId}`);
        } catch (e) {
            await cancelMatchmaking();
            const message = e instanceof Error ? e.message : 'No opponents found. Try again later.';
            setErrorMessage(message);
            setStatus('error');
            setSocketState('error');
        }
    }, [initGame, router, setMatchId, setMatchToken, setNakamaSession, setOnlineMode, setPlayerColor, setSocketState, setUserId]);

    const startMatch = useCallback(async () => {
        if (mode === 'bot') {
            startBotGame();
        } else {
            await startOnlineMatch();
        }
    }, [mode, startBotGame, startOnlineMatch]);

    return { startMatch, status, errorMessage, onlineCount, mode };
};

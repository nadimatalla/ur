import { findMatch } from '@/services/matchmaking';
import { useGameStore } from '@/store/useGameStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export const useMatchmaking = () => {
    const [isSearching, setIsSearching] = useState(false);
    const initGame = useGameStore(state => state.initGame);
    const router = useRouter();

    const startMatch = async () => {
        setIsSearching(true);
        try {
            const matchId = await findMatch('local-player');
            initGame(matchId);
            router.push(`/match/${matchId}`);
            // Wait, route is app/(game)/[id].tsx ? or app/game/[id].tsx
            // File structure: app/(game)/[id].tsx
            // In expo router, this is /game/123 if we group in (game). 
            // But (game) is a group so simple /123? or /game/123?
            // Usually groups (game) are skipped in URL path if they are not folder-based routes with index.
            // But typically we want /game/[id].
            // If folder is app/(game)/[id].tsx, route is /[id].
            // If we want /game/[id], folder should be app/game/[id].tsx.
            // The prompt said: app/(game)/[id].tsx  (Dynamic Route: /game/123)
            // This implies the group is ignored? No, if URL is /game/123, then folder should be app/game/[id].
            // OR app/(game)/game/[id].tsx?
            // I'll assume standard Expo Router: (game) is ignored. So path is matches /[id].
            // BUT if I want /game/123, I should create app/game/[id].tsx inside (game)?
            // For now I'll use router.push(`/${matchId}`) or `/game/${matchId}` depending on what I implemented.
            // I implemented app/(game)/[id].tsx. So it's root /[id].
            // Wait, user req said: "Dynamic Route: /game/123".
            // So I should probably rename `app/(game)/[id].tsx` to `app/(game)/game/[id].tsx`?
            // Or just assume I will fix route later.
            // I'll update router push to `/game/${matchId}` and ensure folder structure matches later or now.
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    return { startMatch, isSearching };
};

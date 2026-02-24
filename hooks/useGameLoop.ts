import { getBotMove } from '@/logic/bot/bot';
import { useGameStore } from '@/store/useGameStore';
import { useEffect } from 'react';

export const useGameLoop = (enabled = true) => {
    const gameState = useGameStore(state => state.gameState);
    const roll = useGameStore(state => state.roll);
    const makeMove = useGameStore(state => state.makeMove);

    useEffect(() => {
        if (!enabled) return;

        const { currentTurn, phase, winner, rollValue } = gameState;

        if (winner) return;

        if (currentTurn === 'dark') {
            // Bot Turn
            if (phase === 'rolling') {
                // Bot needs to roll the dice
                const timer = setTimeout(() => {
                    roll();
                }, 800);
                return () => clearTimeout(timer);
            } else if (phase === 'moving') {
                // Bot needs to move
                // Delay for visual effect
                const timer = setTimeout(() => {
                    const move = getBotMove(gameState, rollValue!);
                    if (move) {
                        makeMove(move);
                    } else {
                        // If no moves, store handles auto-skip in roll()?
                        // `roll()` in store calculates moves. If 0, it auto-skips.
                        // So if we are in 'moving' phase, validMoves > 0.
                        // So move should exist.
                    }
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [enabled, gameState.currentTurn, gameState.phase, gameState.rollValue]);
};

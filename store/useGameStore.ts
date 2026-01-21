import { create } from 'zustand';
import { GameState, MoveAction, PlayerColor } from '@/logic/types';
import { createInitialState, getValidMoves, applyMove, rollDice } from '@/logic/engine';
import { getBotMove } from '@/logic/bot/bot';

interface GameStore {
    gameState: GameState;
    playerId: string; // 'light'
    matchId: string | null;
    validMoves: MoveAction[];

    // Actions
    initGame: (matchId: string) => void;
    roll: () => void;
    makeMove: (move: MoveAction) => void;
    reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
    gameState: createInitialState(),
    playerId: 'light',
    matchId: null,
    validMoves: [],

    initGame: (matchId) => {
        set({
            matchId,
            gameState: createInitialState(),
            validMoves: []
        });
    },

    reset: () => {
        set({
            matchId: null,
            gameState: createInitialState(),
            validMoves: []
        });
    },

    roll: () => {
        const { gameState } = get();
        if (gameState.phase !== 'rolling') return;

        const rollValue = rollDice();
        // Force type casting or ensure types match. 
        // Types: rollValue: number. gameState.rollValue: number | null.
        // phase: 'moving'.
        const nextState: GameState = {
            ...gameState,
            rollValue,
            phase: 'moving'
        };

        const validMoves = getValidMoves(nextState, rollValue);

        if (validMoves.length === 0) {
            setTimeout(() => {
                const skippedState: GameState = { ...nextState };
                skippedState.currentTurn = skippedState.currentTurn === 'light' ? 'dark' : 'light';
                skippedState.phase = 'rolling';
                skippedState.rollValue = null;
                skippedState.history.push(`${gameState.currentTurn} rolled ${rollValue} but had no moves.`);

                set({ gameState: skippedState, validMoves: [] });

                // Bot trigger handled by hook or here? 
                // If we rely on hook, we just switch state.
            }, 1000);

            set({ gameState: nextState, validMoves: [] });
            return;
        }

        set({ gameState: nextState, validMoves });
    },

    makeMove: (move) => {
        const { gameState } = get();
        if (gameState.phase !== 'moving') return;

        const newState = applyMove(gameState, move);
        set({ gameState: newState, validMoves: [] });
    }
}));

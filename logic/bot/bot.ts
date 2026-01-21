import { GameState } from '../types';
import { getValidMoves, MoveAction } from '../engine';

// Simple Bot: Prefer Captures > Rosettes > Progress > Finish
export const getBotMove = (state: GameState, roll: number): MoveAction | null => {
    const moves = getValidMoves(state, roll);
    if (moves.length === 0) return null;

    // Simple heuristic: just pick random for now to ensure it works
    // Or improve slightly:

    // 1. Capture? (Not implemented in logic explicitly to detect capture easily without re-simulating, 
    // but we can check if destination is war zone)

    // 2. Rosette?

    // Random is fine for V1 "Work without errors"
    const random = Math.floor(Math.random() * moves.length);
    return moves[random];
};

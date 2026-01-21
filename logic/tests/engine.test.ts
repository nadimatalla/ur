import { createInitialState, getValidMoves, applyMove, MoveAction, rollDice } from '../engine';
import { GameState } from '../types';

describe('Game Engine', () => {
    let state: GameState;

    beforeEach(() => {
        state = createInitialState();
    });

    it('should initialize correctly', () => {
        expect(state.currentTurn).toBe('light');
        expect(state.light.pieces.length).toBe(7);
        expect(state.phase).toBe('rolling');
    });

    it('should generate valid moves from start', () => {
        const roll = 1;
        state.phase = 'moving'; // simulation
        const moves = getValidMoves(state, roll);

        // Single move possible from start to index 0 (if path length > 0)
        // Actually, logic collapses multiple pieces at -1.
        expect(moves.length).toBeGreaterThan(0);
        expect(moves[0].fromIndex).toBe(-1);
        expect(moves[0].toIndex).toBe(-1 + roll);
    });

    it('should apply move correctly', () => {
        const roll = 1;
        const moves = getValidMoves(state, roll);
        const move = moves[0];

        const newState = applyMove(state, move);
        const playerPiece = newState.light.pieces.find(p => p.id === move.pieceId);

        expect(playerPiece?.position).toBe(0);

        // Turn logic:
        // Position 0 is (2,3) for Light. Not a Rosette.
        // So turn should switch.
        expect(newState.currentTurn).toBe('dark');
        expect(newState.phase).toBe('rolling');
    });
});

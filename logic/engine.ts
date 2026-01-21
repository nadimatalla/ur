// import { produce } from 'immer';
import { GameState, PlayerColor, Piece, Player, MoveAction } from './types';
import { PATH_LIGHT, PATH_DARK, isRosette, isWarZone, PATH_LENGTH } from './constants';

export const INITIAL_PIECE_COUNT = 7;

const createPlayer = (color: PlayerColor): Player => ({
    id: color,
    color,
    pieces: Array.from({ length: INITIAL_PIECE_COUNT }).map((_, i) => ({
        id: `${color}-${i}`,
        owner: color,
        position: -1,
        isFinished: false,
    })),
    capturedCount: 0,
    finishedCount: 0,
});

export const createInitialState = (): GameState => ({
    currentTurn: 'light',
    rollValue: null,
    phase: 'rolling',
    light: createPlayer('light'),
    dark: createPlayer('dark'),
    winner: null,
    history: [],
});

export const rollDice = (): number => {
    let sum = 0;
    for (let i = 0; i < 4; i++) {
        if (Math.random() > 0.5) sum++;
    }
    return sum;
};

const getPathCoord = (color: PlayerColor, index: number) => {
    const path = color === 'light' ? PATH_LIGHT : PATH_DARK;
    return path[index];
};

export const getValidMoves = (state: GameState, roll: number): MoveAction[] => {
    if (roll === 0) return [];

    const player = state[state.currentTurn];
    const opponent = state[state.currentTurn === 'light' ? 'dark' : 'light'];
    const moves: MoveAction[] = [];
    const processedPositions = new Set<number>();

    for (const piece of player.pieces) {
        if (piece.isFinished) continue;

        if (piece.position === -1 && processedPositions.has(-1)) continue;
        if (piece.position === -1) processedPositions.add(-1);

        const targetIndex = piece.position + roll;

        if (targetIndex > PATH_LENGTH) continue;

        if (targetIndex === PATH_LENGTH) {
            moves.push({ pieceId: piece.id, fromIndex: piece.position, toIndex: targetIndex });
            continue;
        }

        const myPieceAtTarget = player.pieces.find(p => p.position === targetIndex && !p.isFinished);
        if (myPieceAtTarget) continue;

        const targetCoord = getPathCoord(player.color, targetIndex);
        const isShared = isWarZone(targetCoord.row, targetCoord.col);

        const opponentPiece = opponent.pieces.find(p => {
            if (p.isFinished || p.position === -1) return false;
            const opCoord = getPathCoord(opponent.color, p.position);
            return opCoord.row === targetCoord.row && opCoord.col === targetCoord.col;
        });

        if (opponentPiece) {
            const targetIsRosette = isRosette(targetCoord.row, targetCoord.col);
            if (targetIsRosette && isShared) {
                continue;
            }
        }

        moves.push({ pieceId: piece.id, fromIndex: piece.position, toIndex: targetIndex });
    }

    return moves;
};

export const applyMove = (state: GameState, move: MoveAction): GameState => {
    const newState = JSON.parse(JSON.stringify(state)) as GameState;

    const player = newState[newState.currentTurn];
    const opponent = newState[newState.currentTurn === 'light' ? 'dark' : 'light'];

    const piece = player.pieces.find(p => p.id === move.pieceId)!;
    piece.position = move.toIndex;

    if (move.toIndex === PATH_LENGTH) {
        piece.isFinished = true;
        player.finishedCount++;
    }

    if (move.toIndex < PATH_LENGTH) {
        const targetCoord = getPathCoord(player.color, move.toIndex);
        const opponentPiece = opponent.pieces.find(p => {
            if (p.isFinished || p.position === -1) return false;
            const opCoord = getPathCoord(opponent.color, p.position);
            return opCoord.row === targetCoord.row && opCoord.col === targetCoord.col;
        });

        if (opponentPiece) {
            opponentPiece.position = -1;
            player.capturedCount++;
            newState.history.push(`${player.color} captured ${opponent.color}`);
        }
    }

    let isRosetteLanding = false;
    if (move.toIndex < PATH_LENGTH) {
        const coord = getPathCoord(player.color, move.toIndex);
        if (isRosette(coord.row, coord.col)) {
            isRosetteLanding = true;
        }
    }

    newState.history.push(`${player.color} moved to ${move.toIndex}. Rosette: ${isRosetteLanding}`);

    if (isRosetteLanding) {
        newState.phase = 'rolling';
        newState.rollValue = null;
    } else {
        newState.currentTurn = newState.currentTurn === 'light' ? 'dark' : 'light';
        newState.phase = 'rolling';
        newState.rollValue = null;
    }

    if (player.finishedCount >= INITIAL_PIECE_COUNT) {
        newState.winner = player.color;
        newState.phase = 'ended';
    }

    return newState;
};

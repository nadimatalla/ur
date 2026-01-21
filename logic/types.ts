export type PlayerColor = 'light' | 'dark';

export interface Piece {
    id: string; // unique id (e.g. 'light-1')
    owner: PlayerColor;
    position: number; // 0-14 (path index), or -1 (start), or 15 (finished)
    isFinished: boolean;
}

export interface Player {
    id: string; // 'light' or 'dark' (or actual user id)
    color: PlayerColor;
    pieces: Piece[];
    capturedCount: number; // redundancy, can be calc'd
    finishedCount: number; // redundancy
}

export type GamePhase = 'rolling' | 'moving' | 'ended';

export interface GameState {
    // Turn State
    currentTurn: PlayerColor;
    rollValue: number | null; // 0-4
    phase: GamePhase;

    // Players
    light: Player;
    dark: Player;

    // Meta
    winner: PlayerColor | null;
    history: string[]; // basic notation log
}

export interface Coordinates {
    row: number;
    col: number;
}


export interface MoveAction {
    pieceId: string;
    fromIndex: number; // -1 for start
    toIndex: number;
}

export interface TileNode {
    type: 'normal' | 'rosette' | 'safe' | 'war';
    coord: Coordinates;
    pathIndexLight?: number; // 0-13, 14 is finish
    pathIndexDark?: number;
}

import { BOARD_COLS, BOARD_ROWS, PATH_DARK, PATH_LIGHT } from '@/logic/constants';
import { useGameStore } from '@/store/useGameStore';
import React from 'react';
import { View } from 'react-native';
import { Tile } from './Tile';

export const Board: React.FC = () => {
    const gameState = useGameStore(state => state.gameState);
    const validMoves = useGameStore(state => state.validMoves);
    const makeMove = useGameStore(state => state.makeMove);
    const playerId = 'light'; // Local human is always light in this demo

    // Helper to find piece at (r,c)
    const getPieceAt = (r: number, c: number): { id: string, color: 'light' | 'dark' } | undefined => {
        // Light
        const lightPiece = gameState.light.pieces.find(p => !p.isFinished && p.position !== -1 && mapIndexToCoord('light', p.position, r, c));
        if (lightPiece) return { id: lightPiece.id, color: 'light' };

        const darkPiece = gameState.dark.pieces.find(p => !p.isFinished && p.position !== -1 && mapIndexToCoord('dark', p.position, r, c));
        if (darkPiece) return { id: darkPiece.id, color: 'dark' };

        return undefined;
    };

    const mapIndexToCoord = (color: 'light' | 'dark', index: number, r: number, c: number) => {
        const path = color === 'light' ? PATH_LIGHT : PATH_DARK;
        const coord = path[index];
        if (!coord) return false;
        return coord.row === r && coord.col === c;
    };

    const handleTilePress = (r: number, c: number) => {
        if (gameState.currentTurn !== playerId) return;

        // First, check if there's a piece at this location that can score (toIndex === 14)
        const scoringMove = validMoves.find(m => {
            if (m.toIndex !== 14) return false;
            // Check if the piece's current position matches this tile
            return mapIndexToCoord(playerId, m.fromIndex, r, c);
        });

        if (scoringMove) {
            makeMove(scoringMove);
            return;
        }

        // Otherwise, find if this tile is a valid destination for any move
        const move = validMoves.find(m => {
            if (m.toIndex === 14) return false; // Scoring moves handled above
            return mapIndexToCoord(playerId, m.toIndex, r, c);
        });

        if (move) {
            makeMove(move);
            return;
        }
    };

    const renderGrid = () => {
        const grid = [];
        for (let r = 0; r < BOARD_ROWS; r++) {
            const rowCells = [];
            for (let c = 0; c < BOARD_COLS; c++) {
                // Check if tile exists (Ur board has gaps)
                const isGap = (r === 0 || r === 2) && (c === 4 || c === 5);

                if (isGap) {
                    rowCells.push(<View key={`${r}-${c}`} style={{ flex: 1, margin: 4 }} />); // Empty space
                } else {
                    const piece = getPieceAt(r, c);

                    // Check if this tile is a valid target for the current player
                    let isValidTarget = false;
                    if (gameState.currentTurn === playerId) {
                        // Check if a piece here can score (move off the board)
                        const canScore = validMoves.some(m => {
                            if (m.toIndex !== 14) return false;
                            return mapIndexToCoord(playerId, m.fromIndex, r, c);
                        });

                        // Check if this is a valid destination for a move
                        const isDestination = validMoves.some(m => {
                            if (m.toIndex === 14) return false;
                            return mapIndexToCoord(playerId, m.toIndex, r, c);
                        });

                        isValidTarget = canScore || isDestination;
                    }

                    rowCells.push(
                        <View key={`${r}-${c}`} style={{ width: '12.5%', aspectRatio: 1 }}>
                            <Tile
                                row={r}
                                col={c}
                                piece={piece}
                                isValidTarget={isValidTarget}
                                onPress={() => handleTilePress(r, c)}
                            />
                        </View>
                    );
                }
            }
            grid.push(<View key={r} style={{ flexDirection: 'row', justifyContent: 'center', width: '100%' }}>{rowCells}</View>);
        }
        return grid;
    };

    return (
        <View style={{
            width: '100%',
            maxWidth: 672, // 2xl = 42rem = 672px
            aspectRatio: 8 / 3,
            minHeight: 200,
            justifyContent: 'center',
            gap: 4,
            padding: 8,
            alignSelf: 'center'
        }}>
            {renderGrid()}
        </View>
    );
};

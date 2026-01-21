import { isRosette, isWarZone } from '@/logic/constants';
import { PlayerColor } from '@/logic/types';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Piece } from './Piece';

interface TileProps {
    row: number;
    col: number;
    piece?: { id: string, color: PlayerColor }; // If occupied
    isValidTarget?: boolean; // If current roll allows moving here
    onPress?: () => void;
    lastMoveSource?: boolean; // Highlight previous position?
    lastMoveDest?: boolean;
}

export const Tile: React.FC<TileProps> = ({ row, col, piece, isValidTarget, onPress, lastMoveSource, lastMoveDest }) => {
    const rosette = isRosette(row, col);
    const war = isWarZone(row, col);

    // Styling
    // Normal: Stone Light
    // Rosette: Special pattern (border or icon)
    // War: Maybe slight red tint or just stone
    // Valid Target: Green glow or border

    let bgClass = "bg-stone-200";
    if (rosette) bgClass = "bg-stone-300 border-2 border-royal-gold";
    if (war && !rosette) bgClass = "bg-stone-200"; // War zone same color usually or checkered

    if (isValidTarget) bgClass += " bg-green-100 border-2 border-green-500";
    if (lastMoveDest) bgClass += " bg-yellow-100";

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={!isValidTarget}
            style={{
                width: '100%',
                height: '100%',
                aspectRatio: 1,
                backgroundColor: rosette ? '#d6d3d1' : '#e7e5e4', // stone-300 : stone-200
                borderWidth: rosette ? 2 : 0,
                borderColor: rosette ? '#f59e0b' : 'transparent', // royal-gold
                borderRadius: 6,
                alignItems: 'center',
                justifyContent: 'center',
                margin: 4,
                ...(isValidTarget && {
                    backgroundColor: '#dcfce7', // green-100
                    borderWidth: 2,
                    borderColor: '#22c55e', // green-500
                }),
                ...(lastMoveDest && {
                    backgroundColor: '#fef3c7', // yellow-100
                }),
            }}
        >
            {/* Rosette Marker */}
            {rosette && !piece && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                    <View style={{ width: 32, height: 32, transform: [{ rotate: '45deg' }], borderWidth: 4, borderColor: '#f59e0b' }} />
                </View>
            )}

            {/* Coordinates (Debug) */}
            {/* <Text style={{ fontSize: 8, position: 'absolute', top: 4, left: 4, color: '#9ca3af' }}>{row},{col}</Text> */}

            {/* Valid Move Indicator (Dot) */}
            {isValidTarget && !piece && (
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#4ade80', opacity: 0.5 }} />
            )}

            {/* Piece */}
            {piece && (
                <View style={{ opacity: isValidTarget ? 0.5 : 1 }}>
                    {/* If valid target has piece (capture), maybe show transparent red? */}
                    <Piece color={piece.color} />
                </View>
            )}
        </TouchableOpacity>
    );
};

import { PlayerColor } from '@/logic/types';
import React from 'react';
import { View } from 'react-native';

interface PieceProps {
    color: PlayerColor;
    highlight?: boolean;
}

export const Piece: React.FC<PieceProps> = ({ color, highlight }) => {
    // Light = White/Gold, Dark = Black/Obsidian
    const bgColor = color === 'light' ? '#f5f5f4' : '#1e293b'; // stone-100 : slate-800
    const borderColor = color === 'light' ? '#1e3a8a' : '#ffffff'; // royal-blue : white
    const innerBgColor = color === 'light' ? '#f59e0b' : '#f59e0b'; // royal-gold for both

    return (
        <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: bgColor,
            borderWidth: highlight ? 4 : 1,
            borderColor: borderColor,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
        }}>
            {/* Inner detail */}
            <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                opacity: 0.5,
                backgroundColor: innerBgColor
            }} />
        </View>
    );
};

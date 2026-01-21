import React from 'react';
import { Text, View } from 'react-native';

interface AvatarProps {
    initials?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ initials = 'UR', size = 'md' }) => {
    const sizeClass = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16';
    const textClass = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-base' : 'text-xl';

    return (
        <View className={`${sizeClass} rounded-full bg-slate-300 items-center justify-center border-2 border-white overflow-hidden`}>
            <Text className={`${textClass} font-bold text-slate-700`}>{initials.substring(0, 2).toUpperCase()}</Text>
        </View>
    );
};

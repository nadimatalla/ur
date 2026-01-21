import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline';
    loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ title, variant = 'primary', loading, className, ...props }) => {
    let baseClass = "px-6 py-3 rounded-xl flex-row justify-center items-center active:opacity-80";
    let textClass = "text-lg font-bold text-center";

    if (variant === 'primary') {
        baseClass += " bg-royal-blue";
        textClass += " text-white";
    } else if (variant === 'secondary') {
        baseClass += " bg-royal-gold";
        textClass += " text-royal-blue";
    } else if (variant === 'outline') {
        baseClass += " border-2 border-royal-blue";
        textClass += " text-royal-blue";
    }

    return (
        <TouchableOpacity className={`${baseClass} ${className}`} disabled={loading || props.disabled} {...props}>
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? 'white' : '#1e3a8a'} />
            ) : (
                <Text className={textClass}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

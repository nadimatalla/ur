import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

interface DiceProps {
    value: number | null; // 0-4
    rolling: boolean;
    onRoll: () => void;
    canRoll: boolean;
}

// Visual representation of 4 tetrahedral dice
// If value is null, show ? or 0
export const Dice: React.FC<DiceProps> = ({ value, rolling, onRoll, canRoll }) => {
    // Use simple rotation or bounce
    const offset = useSharedValue(0);

    useEffect(() => {
        if (rolling) {
            offset.value = withSequence(
                withTiming(-10, { duration: 100 }),
                withTiming(10, { duration: 100 }),
                withTiming(-10, { duration: 100 }),
                withTiming(10, { duration: 100 }),
                withSpring(0)
            );
        }
    }, [rolling]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: offset.value }],
    }));

    return (
        <TouchableOpacity
            onPress={onRoll}
            disabled={!canRoll || rolling}
            style={{
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
                backgroundColor: canRoll ? '#f59e0b' : '#d1d5db', // royal-gold : gray-300
                opacity: canRoll ? 1 : 0.5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: canRoll ? 0.3 : 0,
                shadowRadius: 5,
                elevation: canRoll ? 8 : 0,
            }}
        >
            <Animated.View style={[animatedStyle, { flexDirection: 'row', gap: 8 }]}>
                {/* Render 4 dice visuals */}
                {/* Simply show value for now, or 4 pips */}
                {[0, 1, 2, 3].map(i => {
                    // Visualize probability? 
                    // In Ur, 4 dice, each has 50% chance of 1.
                    // If we have total `value` (e.g. 3), we need to visually show 3 success, 1 fail.
                    // If rolling, show random?
                    // Since `value` is the result, we only know it after roll.
                    // While rolling (value is usually null or old), show '...'.

                    // Deterministic visualization:
                    // if value=2, Dice 0,1=ON, 2,3=OFF.
                    const isOn = value !== null && i < value;

                    return (
                        <View key={i} style={{
                            width: 32,
                            height: 32,
                            transform: [{ rotate: '45deg' }],
                            borderWidth: 1,
                            borderColor: '#1e3a8a', // royal-blue
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isOn ? '#1e3a8a' : '#ffffff', // royal-blue : white
                        }}>
                            {/* Pyramid tip */}
                            {isOn && <View style={{ width: 8, height: 8, backgroundColor: '#ffffff', borderRadius: 4 }} />}
                        </View>
                    );
                })}
            </Animated.View>
            <Text style={{
                marginTop: 8,
                fontWeight: 'bold',
                color: '#ffffff',
                textAlign: 'center',
                textTransform: 'uppercase',
                fontSize: 12,
            }}>
                {rolling ? 'Rolling...' : value !== null ? `Rolled: ${value}` : 'Tap to Roll'}
            </Text>
        </TouchableOpacity>
    );
};

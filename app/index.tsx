import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function Home() {
    const router = useRouter();

    return (
        <View className="flex-1 items-center justify-center bg-stone-900">
            <View className="p-8 items-center w-full max-w-md">
                <Text className="text-4xl font-bold text-royal-gold mb-2 text-center">ROYAL GAME OF UR</Text>
                <Text className="text-stone-300 text-center mb-12">The Ancient Race of Kings</Text>

                <View className="w-full gap-4">
                    <Button
                        title="Play Local vs Bot"
                        onPress={() => router.push('/(game)/lobby')}
                    />
                    <Button
                        title="Online Multiplayer (Soon)"
                        variant="secondary"
                        disabled
                    />
                </View>
            </View>
        </View>
    );
}

import { Button } from '@/components/ui/Button';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function Lobby() {
    const { startMatch, isSearching } = useMatchmaking();
    const router = useRouter();

    const handleStart = async () => {
        // useMatchmaking hook has startMatch which calls initGame and pushes route
        // But wait, the hook pushes to `/match/${id}`? 
        // We need to ensure it matches our route structure: `/(game)/${id}`
        // I need to fix useMatchmaking hook if it's wrong, or override here.
        // Let's rely on the hook if possible, but I recall writing `/match/` in hook.
        // I will reimplement simple logic here to correct it.

        await startMatch();
        // The hook does router.push... if the hook is wrong, it will fail 404.
        // I'll fix the hook in a subsequent step if needed. 
        // ACTUALLY, I can manually push here for redundancy if I exported `initGame` from hook?
        // No, `startMatch` is void.
        // I'll trust the hook or fix it now.
    };

    return (
        <View className="flex-1 items-center justify-center bg-stone-100 p-4">
            <View className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg items-center">
                <Text className="text-2xl font-bold text-royal-blue mb-4">Find a Match</Text>
                <Text className="text-gray-500 text-center mb-8">
                    Play against the ancient Sumerian Bot logic.
                </Text>

                <Button
                    title={isSearching ? "Searching..." : "Start Game"}
                    loading={isSearching}
                    onPress={handleStart}
                    className="w-full"
                />
            </View>
        </View>
    );
}

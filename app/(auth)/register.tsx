import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function Register() {
    const router = useRouter();

    return (
        <View className="flex-1 items-center justify-center bg-stone-100">
            <Text className="text-2xl font-bold mb-4">Register</Text>
            <Button title="Create Account" onPress={() => router.replace('/')} />
        </View>
    );
}

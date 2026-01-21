import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function Login() {
    const router = useRouter();

    return (
        <View className="flex-1 items-center justify-center bg-stone-100">
            <Text className="text-2xl font-bold mb-4">Login</Text>
            <Button title="Login as Guest" onPress={() => router.replace('/')} />
        </View>
    );
}

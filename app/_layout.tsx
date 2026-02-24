import { urTheme } from '@/constants/urTheme';
import { Stack } from 'expo-router';
import { View } from 'react-native';

import '../global.css';

export default function Layout() {
  return (
    <View style={{ flex: 1, backgroundColor: urTheme.colors.night }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#122736' },
          headerTintColor: urTheme.colors.parchment,
          headerShadowVisible: false,
          headerTitleStyle: {
            fontFamily: 'serif',
            fontWeight: '700',
          },
          contentStyle: { backgroundColor: urTheme.colors.night },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Royal Game of Ur', headerShown: false }} />
        <Stack.Screen name="(game)/lobby" options={{ title: 'Lobby' }} />
        <Stack.Screen name="match/[id]" options={{ title: 'Game Room', headerBackTitle: 'Lobby' }} />
        <Stack.Screen name="tutorial/watch" options={{ title: 'Tutorial (Watch)' }} />
      </Stack>
    </View>
  );
}

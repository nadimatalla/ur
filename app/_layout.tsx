import { Stack } from 'expo-router';
import { View } from 'react-native';


// Load NativeWind (required for web sometimes if not configured in babel)
import "../global.css";

export default function Layout() {
  // Optional: Load fonts here
  // const [loaded] = useFonts({ ... });

  return (
    <View className="flex-1 bg-stone-light">
      <Stack screenOptions={{
        headerStyle: { backgroundColor: '#1e3a8a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: '#f3f4f6' }
      }}>
        <Stack.Screen name="index" options={{ title: 'Royal Game of Ur', headerShown: false }} />
        <Stack.Screen name="(game)/lobby" options={{ title: 'Lobby' }} />
        <Stack.Screen name="match/[id]" options={{ title: 'Game Room', headerBackTitle: 'Lobby' }} />
      </Stack>
    </View>
  );
}

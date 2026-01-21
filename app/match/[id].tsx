import { Board } from '@/components/game/Board';
import { Dice } from '@/components/game/Dice';
import { Modal } from '@/components/ui/Modal';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useGameStore } from '@/store/useGameStore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function GameRoom() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    // Game Loop Hook (Bot)
    useGameLoop();

    const gameState = useGameStore(state => state.gameState);
    const roll = useGameStore(state => state.roll);
    const reset = useGameStore(state => state.reset);

    // Local Player is Light
    const isMyTurn = gameState.currentTurn === 'light';
    const canRoll = isMyTurn && gameState.phase === 'rolling';

    const handleRoll = () => {
        if (canRoll) roll();
    };

    const [showWinModal, setShowWinModal] = React.useState(false);

    useEffect(() => {
        if (gameState.winner) {
            setShowWinModal(true);
        }
    }, [gameState.winner]);

    const handleExit = () => {
        setShowWinModal(false);
        reset();
        router.replace('/');
    };

    return (
        <View className="flex-1 bg-stone-light">
            <Stack.Screen options={{ title: `Game #${id}` }} />

            <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
                {/* Status Bar */}
                <View className="flex-row justify-between w-full mb-8">
                    <View className="items-center">
                        <Text className="font-bold text-royal-blue text-lg">YOU (Light)</Text>
                        <Text>Finished: {gameState.light.finishedCount}/7</Text>
                    </View>
                    <View className="items-center">
                        <Text className="font-bold text-slate-700 text-lg">BOT (Dark)</Text>
                        <Text>Finished: {gameState.dark.finishedCount}/7</Text>
                    </View>
                </View>

                {/* Turn Indicator */}
                <View className={`mb-4 px-4 py-2 rounded-full ${isMyTurn ? 'bg-royal-blue' : 'bg-slate-700'}`}>
                    <Text className="text-white font-bold uppercase">
                        {isMyTurn ? "Your Turn" : "Opponent Turn"}
                    </Text>
                </View>

                {/* Board */}
                <Board />

                {/* Controls */}
                <View className="mt-8 w-full max-w-xs">
                    <Dice
                        value={gameState.rollValue}
                        rolling={false} // Animation logic handled in Dice component via effect? 
                        // Actually we pass 'rolling' prop if we want to show rolling state.
                        // For now simple.
                        onRoll={handleRoll}
                        canRoll={canRoll}
                    />
                </View>

                {/* History Log */}
                <View className="mt-8 w-full bg-white p-4 rounded-lg bg-opacity-50">
                    <Text className="font-bold mb-2">Game Log:</Text>
                    {gameState.history.slice(-3).map((log, i) => (
                        <Text key={i} className="text-xs text-gray-500">{log}</Text>
                    ))}
                </View>

            </ScrollView>

            {/* Win Modal */}
            <Modal
                visible={showWinModal}
                title={gameState.winner === 'light' ? "VICTORY!" : "DEFEAT"}
                message={gameState.winner === 'light' ? "The Royal Game is yours!" : "The Bot has bested you."}
                actionLabel="Return to Menu"
                onAction={handleExit}
            />
        </View>
    );
}

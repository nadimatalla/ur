import React from 'react';
import { Modal as RNModal, Text, View } from 'react-native';
import { Button } from './Button';

interface ModalProps {
    visible: boolean;
    title: string;
    message: string;
    actionLabel: string;
    onAction: () => void;
}

export const Modal: React.FC<ModalProps> = ({ visible, title, message, actionLabel, onAction }) => {
    return (
        <RNModal transparent visible={visible} animationType="fade">
            <View className="flex-1 bg-black/50 items-center justify-center p-4">
                <View className="bg-stone-100 p-6 rounded-2xl w-full max-w-sm border-4 border-royal-blue items-center shadow-xl">
                    <Text className="text-2xl font-bold text-royal-blue mb-2 font-serif">{title}</Text>
                    <Text className="text-slate-700 text-center mb-6">{message}</Text>

                    <Button title={actionLabel} onPress={onAction} />
                </View>
            </View>
        </RNModal>
    );
};

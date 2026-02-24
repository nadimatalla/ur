import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import React from 'react';
import { Image, Modal as RNModal, StyleSheet, Text, View } from 'react-native';
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
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.texture} />
          <Image source={urTextures.border} resizeMode="repeat" style={styles.borderTexture} />
          <View style={styles.sheetGlow} />
          <View style={styles.border} />

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonWrap}>
            <Button title={actionLabel} onPress={onAction} />
          </View>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 12, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: urTheme.spacing.md,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    borderRadius: urTheme.radii.lg,
    overflow: 'hidden',
    backgroundColor: '#3B2416',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 164, 65, 0.7)',
    padding: urTheme.spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.34,
    shadowRadius: 18,
    elevation: 12,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  borderTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  sheetGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 219, 164, 0.16)',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(252, 225, 177, 0.33)',
  },
  title: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 30,
    textAlign: 'center',
    marginBottom: urTheme.spacing.sm,
  },
  message: {
    color: 'rgba(247, 229, 203, 0.92)',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
    marginBottom: urTheme.spacing.lg,
  },
  buttonWrap: {
    width: '100%',
  },
});

import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface EdgeScoreProps {
  label: string;
  value: string;
  active?: boolean;
  align?: 'left' | 'right';
}

export const EdgeScore: React.FC<EdgeScoreProps> = ({ label, value, active = false, align = 'left' }) => {
  return (
    <View style={[styles.wrap, align === 'right' && styles.rightWrap, active && styles.activeWrap]}>
      <Image source={urTextures.lapisMosaic} resizeMode="cover" style={styles.texture} />
      <View style={styles.topGlow} />
      <View style={styles.innerBorder} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    minWidth: 110,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: urTheme.radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(200, 152, 30, 0.72)',
    backgroundColor: 'rgba(11, 16, 23, 0.74)',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  rightWrap: {
    alignItems: 'flex-end',
  },
  activeWrap: {
    borderColor: 'rgba(240, 192, 64, 0.95)',
    shadowColor: '#F0C040',
    shadowOpacity: 0.34,
    shadowRadius: 8,
    elevation: 5,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(255, 232, 194, 0.09)',
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: 4,
    borderRadius: urTheme.radii.xs + 1,
    borderWidth: 1,
    borderColor: 'rgba(248, 228, 188, 0.2)',
  },
  label: {
    ...urTypography.label,
    fontSize: 10,
    color: 'rgba(241, 230, 208, 0.82)',
  },
  value: {
    marginTop: 3,
    color: '#F7E9CD',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

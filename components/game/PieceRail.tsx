import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Piece } from './Piece';

interface PieceRailProps {
  label: string;
  color: 'light' | 'dark';
  tokenVariant?: 'light' | 'dark' | 'reserve';
  reserveCount: number;
  totalCount?: number;
  active?: boolean;
}

export const PieceRail: React.FC<PieceRailProps> = ({
  label,
  color,
  tokenVariant,
  reserveCount,
  totalCount = 7,
  active = false,
}) => {
  const glow = useSharedValue(active ? 0.5 : 0);

  useEffect(() => {
    if (active) {
      glow.value = withRepeat(
        withSequence(
          withTiming(0.82, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.25, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(glow);
    glow.value = withTiming(0, { duration: 180 });
  }, [active, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.96 + glow.value * 0.06 }],
  }));

  const shownCount = Math.min(totalCount, reserveCount);
  const emptyCount = Math.max(0, totalCount - shownCount);
  const resolvedVariant = tokenVariant ?? color;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.rail}>
        <Image source={urTextures.lapisMosaic} resizeMode="cover" style={[styles.railTexture, color === 'dark' && styles.darkRailTexture]} />
        <View style={styles.railTopGlow} />
        <View style={styles.railBottomShade} />
        <Animated.View style={[styles.activeGlow, glowStyle]} />
        <View style={styles.innerRail} />

        <View style={styles.pieceStack}>
          {Array.from({ length: shownCount }).map((_, index) => (
            <View key={`piece-${index}`} style={[styles.stackPiece, { marginLeft: index === 0 ? 0 : -urTheme.layout.rail.overlap }]}>
              <Piece color={color} size="sm" variant={resolvedVariant} />
            </View>
          ))}

          {Array.from({ length: emptyCount }).map((_, index) => (
            <View key={`empty-${index}`} style={[styles.emptyDot, { marginLeft: shownCount + index === 0 ? 0 : -urTheme.layout.rail.overlap + 2 }]} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 8,
  },
  label: {
    ...urTypography.label,
    color: 'rgba(241, 230, 208, 0.95)',
    fontSize: 12,
    textAlign: 'left',
  },
  rail: {
    minHeight: 66,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1.2,
    borderColor: 'rgba(214, 176, 107, 0.6)',
    backgroundColor: 'rgba(13, 18, 27, 0.72)',
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  railTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
  },
  darkRailTexture: {
    opacity: 0.16,
  },
  railTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(247, 228, 187, 0.1)',
  },
  railBottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '34%',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  activeGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(111, 184, 255, 0.22)',
  },
  innerRail: {
    ...StyleSheet.absoluteFillObject,
    margin: 5,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(248, 231, 196, 0.24)',
  },
  pieceStack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  stackPiece: {
    zIndex: 5,
  },
  emptyDot: {
    width: 24,
    height: 24,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(227, 206, 171, 0.28)',
    backgroundColor: 'rgba(14, 19, 26, 0.52)',
  },
});

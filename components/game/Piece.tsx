import { urTheme } from '@/constants/urTheme';
import { PlayerColor } from '@/logic/types';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface PieceProps {
  color: PlayerColor;
  highlight?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'reserve';
  state?: 'idle' | 'active' | 'captured';
}

export const Piece: React.FC<PieceProps> = ({
  color,
  highlight = false,
  size = 'md',
  variant,
  state = 'idle',
}) => {
  const intro = useSharedValue(0.9);
  const glowPulse = useSharedValue(0);
  const motion = useSharedValue(0);

  const resolvedVariant = variant ?? color;

  useEffect(() => {
    intro.value = withSpring(1, urTheme.motion.spring.game);
  }, [intro]);

  useEffect(() => {
    if (highlight) {
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: urTheme.motion.duration.base, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.2, { duration: urTheme.motion.duration.base, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(glowPulse);
    glowPulse.value = withTiming(0, { duration: urTheme.motion.duration.fast });
  }, [glowPulse, highlight]);

  useEffect(() => {
    if (state === 'captured') {
      motion.value = withSequence(
        withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) }),
      );
      return;
    }

    if (state === 'active') {
      motion.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 420, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(motion);
    motion.value = withTiming(0, { duration: urTheme.motion.duration.fast });
  }, [motion, state]);

  const sizePx = useMemo(() => {
    if (size === 'sm') return 34;
    if (size === 'lg') return 46;
    return 38;
  }, [size]);

  const pieceStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: intro.value * interpolate(motion.value, [0, 1], [1, 1.08], Extrapolation.CLAMP) },
      { translateY: interpolate(motion.value, [0, 1], [0, -2], Extrapolation.CLAMP) },
    ],
    opacity: state === 'captured' ? interpolate(motion.value, [0, 1], [1, 0.35], Extrapolation.CLAMP) : 1,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value * 0.9,
    transform: [{ scale: 0.95 + glowPulse.value * 0.2 }],
  }));

  const palette =
    resolvedVariant === 'light'
      ? {
          shell: '#1F5CAD',
          rim: '#E3BF6E',
          core: '#79AFFF',
          center: '#D6E9FF',
          specular: 'rgba(228, 243, 255, 0.7)',
          shadow: '#0A1A2E',
        }
      : resolvedVariant === 'dark'
        ? {
            shell: '#141820',
            rim: '#CA9A42',
            core: '#765528',
            center: '#E6D7BF',
            specular: 'rgba(255, 229, 189, 0.36)',
            shadow: '#06070A',
          }
        : {
            shell: '#B27830',
            rim: '#F1C270',
            core: '#D39440',
            center: '#F7E1B8',
            specular: 'rgba(255, 244, 219, 0.6)',
            shadow: '#06070A',
          };

  return (
    <Animated.View style={[styles.wrap, { width: sizePx, height: sizePx }, pieceStyle]}>
      {highlight && (
        <Animated.View style={[styles.targetGlow, glowStyle, { width: sizePx + 8, height: sizePx + 8 }]} />
      )}

      <View style={[styles.baseShadow, { width: sizePx - 4, height: sizePx * 0.38 }]} />
      <View
        style={[
          styles.base,
          {
            width: sizePx - 2,
            height: sizePx - 2,
            backgroundColor: palette.shell,
            borderColor: palette.rim,
            shadowColor: palette.shadow,
          },
        ]}
      >
        <View style={[styles.innerRim, { borderColor: 'rgba(241, 230, 208, 0.45)' }]} />
        <View style={styles.topShine} />
        <View style={styles.edgeShade} />
        <View
          style={[
            styles.core,
            {
              width: sizePx * 0.5,
              height: sizePx * 0.5,
              backgroundColor: palette.core,
              borderColor: palette.rim,
            },
          ]}
        >
          <View style={[styles.coreCenter, { width: sizePx * 0.22, height: sizePx * 0.22, backgroundColor: palette.center }]} />
        </View>
        <View style={[styles.specular, { width: sizePx * 0.3, height: sizePx * 0.18, backgroundColor: palette.specular }]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetGlow: {
    position: 'absolute',
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(111, 184, 255, 0.24)',
  },
  baseShadow: {
    position: 'absolute',
    bottom: 2,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(5, 8, 11, 0.34)',
  },
  base: {
    borderRadius: urTheme.radii.pill,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  innerRim: {
    ...StyleSheet.absoluteFillObject,
    margin: 2.4,
    borderRadius: urTheme.radii.pill,
    borderWidth: 0.8,
  },
  topShine: {
    position: 'absolute',
    top: 1,
    left: 4,
    right: 4,
    height: '42%',
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(255, 245, 214, 0.16)',
  },
  edgeShade: {
    position: 'absolute',
    left: 3,
    right: 3,
    bottom: 1,
    height: '36%',
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  core: {
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreCenter: {
    borderRadius: urTheme.radii.pill,
    opacity: 0.9,
  },
  specular: {
    position: 'absolute',
    top: 4,
    left: 6,
    borderRadius: urTheme.radii.pill,
    transform: [{ rotate: '-24deg' }],
  },
});

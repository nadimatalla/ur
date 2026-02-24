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

interface GameStageHUDProps {
  isMyTurn: boolean;
  canRoll: boolean;
  phase: 'rolling' | 'moving' | 'ended';
}

export const GameStageHUD: React.FC<GameStageHUDProps> = ({ isMyTurn, canRoll, phase }) => {
  const turnGlow = useSharedValue(isMyTurn ? 0.75 : 0.2);
  const turnSweep = useSharedValue(0);

  useEffect(() => {
    if (isMyTurn) {
      turnGlow.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 680, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.35, { duration: 680, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      turnSweep.value = 1;
      turnSweep.value = withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) });
      return;
    }

    cancelAnimation(turnGlow);
    turnGlow.value = withTiming(0.2, { duration: 220 });
  }, [isMyTurn, turnGlow, turnSweep]);

  const turnGlowStyle = useAnimatedStyle(() => ({
    opacity: turnGlow.value,
    transform: [{ scale: 0.95 + turnGlow.value * 0.1 }],
  }));

  const turnSweepStyle = useAnimatedStyle(() => ({
    opacity: turnSweep.value * 0.7,
    transform: [{ translateX: (1 - turnSweep.value) * 220 - 110 }],
  }));

  const hint = canRoll
    ? 'Cast the dice to advance'
    : phase === 'moving'
      ? 'Select a glowing destination'
      : phase === 'ended'
        ? 'Match complete'
        : 'Awaiting move';

  return (
    <View style={styles.wrap}>
      <Image source={urTextures.lapisMosaic} resizeMode="cover" style={styles.texture} />
      <View style={styles.topEdgeHighlight} />
      <View style={styles.innerBevel} />
      <Animated.View style={[styles.turnSweep, turnSweepStyle]} />
      <Animated.View style={[styles.turnOrb, turnGlowStyle]} />
      <View style={styles.textWrap}>
        <Text style={styles.turnTitle}>{isMyTurn ? 'Your Turn' : 'Opponent Turn'}</Text>
        <Text style={styles.turnHint}>{hint}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    minHeight: 67,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(15, 20, 29, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(200, 152, 30, 0.72)',
    paddingVertical: 12,
    paddingHorizontal: urTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  topEdgeHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(245, 224, 182, 0.1)',
  },
  innerBevel: {
    ...StyleSheet.absoluteFillObject,
    margin: 4,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(242, 221, 182, 0.2)',
  },
  turnSweep: {
    position: 'absolute',
    left: -100,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(200, 152, 30, 0.20)',
  },
  turnOrb: {
    width: 14,
    height: 14,
    borderRadius: urTheme.radii.pill,
    backgroundColor: '#C89820',
    shadowColor: '#C89820',
    shadowOpacity: 0.82,
    shadowRadius: 7,
    elevation: 6,
  },
  textWrap: {
    marginLeft: urTheme.spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  turnTitle: {
    ...urTypography.label,
    color: urTheme.colors.ivory,
    fontSize: 12,
    letterSpacing: 1.15,
    flexShrink: 1,
  },
  turnHint: {
    color: 'rgba(235, 220, 193, 0.84)',
    fontSize: 11,
    lineHeight: 13,
    marginTop: 1,
    flexShrink: 1,
  },
});

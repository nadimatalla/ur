import { urTheme, urTextures } from '@/constants/urTheme';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface DiceProps {
  value: number | null;
  rolling: boolean;
  onRoll: () => void;
  canRoll: boolean;
  mode?: 'panel' | 'stage';
  showNumericResult?: boolean;
}

export const Dice: React.FC<DiceProps> = ({
  value,
  rolling,
  onRoll,
  canRoll,
  mode = 'panel',
  showNumericResult = true,
}) => {
  const lift = useSharedValue(0);
  const spin = useSharedValue(0);
  const tilt = useSharedValue(0);
  const readiness = useSharedValue(canRoll ? 0.4 : 0);
  const resultPulse = useSharedValue(0);

  useEffect(() => {
    if (rolling) {
      lift.value = withSequence(
        withTiming(-18, { duration: 110, easing: Easing.out(Easing.cubic) }),
        withTiming(9, { duration: 120, easing: Easing.inOut(Easing.quad) }),
        withTiming(-7, { duration: 100, easing: Easing.inOut(Easing.quad) }),
        withSpring(0, urTheme.motion.spring.settle),
      );

      tilt.value = withSequence(
        withTiming(1, { duration: 280, easing: Easing.linear }),
        withTiming(0, { duration: 190, easing: Easing.out(Easing.cubic) }),
      );

      spin.value = withSequence(
        withTiming(1, { duration: 470, easing: Easing.linear }),
        withTiming(0, { duration: 0 }),
      );
    }
  }, [lift, rolling, spin, tilt]);

  useEffect(() => {
    if (canRoll && !rolling) {
      readiness.value = withRepeat(
        withSequence(
          withTiming(0.82, { duration: 850, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.22, { duration: 850, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(readiness);
    readiness.value = withTiming(0, { duration: 180 });
  }, [canRoll, readiness, rolling]);

  useEffect(() => {
    if (value === null || rolling) return;

    resultPulse.value = withSequence(
      withTiming(1, { duration: 170, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 320, easing: Easing.inOut(Easing.quad) }),
    );
  }, [resultPulse, rolling, value]);

  const diceRowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: lift.value },
      { perspective: 850 },
      { rotateX: `${tilt.value * 22}deg` },
      { rotateY: `${spin.value * 60 - 30}deg` },
      { rotateZ: `${spin.value * 36 - 18}deg` },
      { scale: 1 + resultPulse.value * 0.08 },
    ],
  }));

  const readinessStyle = useAnimatedStyle(() => ({
    opacity: readiness.value,
    transform: [{ scale: 0.98 + readiness.value * 0.06 }],
  }));

  const groundShadowStyle = useAnimatedStyle(() => ({
    opacity: 0.22 + (1 - Math.min(Math.abs(lift.value) / 18, 1)) * 0.35,
    transform: [{ scaleX: 0.92 + Math.min(Math.abs(lift.value) / 18, 1) * 0.16 }],
  }));

  const title = rolling ? 'Casting...' : value !== null ? `Result: ${value}` : 'Cast The Dice';
  const subtitle = rolling
    ? 'The astragali are in motion'
    : canRoll
      ? 'Tap to roll'
      : 'Wait for your turn';

  const isStage = mode === 'stage';

  return (
    <TouchableOpacity onPress={onRoll} disabled={!canRoll || rolling} activeOpacity={0.9} style={styles.touchable}>
      <View
        style={[
          styles.card,
          isStage ? styles.stageCard : styles.panelCard,
          canRoll ? styles.cardActive : styles.cardLocked,
        ]}
      >
        <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.cardTexture} />
        <View style={styles.cardTopGlow} />
        <View style={styles.cardBorder} />
        <Animated.View style={[styles.readyHalo, readinessStyle]} />

        <Animated.View style={[styles.groundShadow, groundShadowStyle]} />

        <Animated.View style={[styles.diceRow, diceRowStyle]}>
          {[0, 1, 2, 3].map((index) => {
            const isOn = value !== null && index < value;

            return (
              <View key={index} style={[styles.die3dWrap, isOn ? styles.die3dWrapOn : styles.die3dWrapOff]}>
                <View style={[styles.dieTopFace, isOn ? styles.dieTopFaceOn : styles.dieTopFaceOff]} />
                <View style={[styles.dieFrontFace, isOn ? styles.dieFrontFaceOn : styles.dieFrontFaceOff]} />
                <View style={[styles.dieSideFace, isOn ? styles.dieSideFaceOn : styles.dieSideFaceOff]} />
                <View style={[styles.dieSpecular, isOn ? styles.dieSpecularOn : styles.dieSpecularOff]} />
                {isOn && <View style={styles.diePip} />}
              </View>
            );
          })}
        </Animated.View>

        {showNumericResult && <Text style={styles.title}>{title}</Text>}
        <Text style={[styles.subtitle, isStage && styles.stageSubtitle]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
  },
  card: {
    borderRadius: urTheme.radii.md,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 8,
  },
  panelCard: {
    minHeight: 144,
  },
  stageCard: {
    minHeight: 124,
    borderRadius: urTheme.radii.pill,
  },
  cardActive: {
    backgroundColor: '#5C3622',
    borderColor: 'rgba(230, 193, 121, 0.65)',
  },
  cardLocked: {
    backgroundColor: '#4C4843',
    borderColor: 'rgba(201, 190, 173, 0.35)',
    opacity: 0.75,
  },
  cardTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  cardTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '44%',
    backgroundColor: 'rgba(255, 224, 168, 0.14)',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: 6,
    borderRadius: urTheme.radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(246, 219, 163, 0.36)',
  },
  readyHalo: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: urTheme.radii.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(111, 184, 255, 0.8)',
  },
  groundShadow: {
    position: 'absolute',
    width: 136,
    height: 24,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(5, 10, 17, 0.4)',
    top: 58,
  },
  diceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: urTheme.spacing.sm,
    marginTop: 2,
  },
  die3dWrap: {
    width: 28,
    height: 28,
    borderRadius: urTheme.radii.xs,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  die3dWrapOn: {
    backgroundColor: '#2A6BBC',
    borderColor: 'rgba(235, 204, 137, 0.94)',
    shadowColor: '#2A6BBC',
    shadowOpacity: 0.45,
    shadowRadius: 4,
    elevation: 5,
  },
  die3dWrapOff: {
    backgroundColor: '#C9B08A',
    borderColor: 'rgba(99, 71, 44, 0.56)',
  },
  dieTopFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '56%',
    borderTopLeftRadius: urTheme.radii.xs - 1,
    borderTopRightRadius: urTheme.radii.xs - 1,
  },
  dieTopFaceOn: {
    backgroundColor: 'rgba(153, 201, 255, 0.44)',
  },
  dieTopFaceOff: {
    backgroundColor: 'rgba(255, 242, 209, 0.3)',
  },
  dieFrontFace: {
    position: 'absolute',
    left: 2,
    right: 2,
    bottom: 1,
    height: '34%',
    borderBottomLeftRadius: urTheme.radii.xs - 2,
    borderBottomRightRadius: urTheme.radii.xs - 2,
  },
  dieFrontFaceOn: {
    backgroundColor: 'rgba(15, 35, 58, 0.36)',
  },
  dieFrontFaceOff: {
    backgroundColor: 'rgba(68, 43, 22, 0.15)',
  },
  dieSideFace: {
    position: 'absolute',
    top: 2,
    bottom: 3,
    right: 1,
    width: 6,
    borderTopRightRadius: urTheme.radii.xs - 2,
    borderBottomRightRadius: urTheme.radii.xs - 2,
  },
  dieSideFaceOn: {
    backgroundColor: 'rgba(11, 28, 46, 0.3)',
  },
  dieSideFaceOff: {
    backgroundColor: 'rgba(75, 46, 28, 0.12)',
  },
  dieSpecular: {
    position: 'absolute',
    top: 4,
    left: 5,
    width: 10,
    height: 4,
    borderRadius: urTheme.radii.pill,
  },
  dieSpecularOn: {
    backgroundColor: 'rgba(233, 247, 255, 0.62)',
  },
  dieSpecularOff: {
    backgroundColor: 'rgba(255, 243, 221, 0.34)',
  },
  diePip: {
    width: 8,
    height: 8,
    borderRadius: urTheme.radii.pill,
    backgroundColor: urTheme.colors.ivory,
    borderWidth: 0.8,
    borderColor: 'rgba(21, 13, 7, 0.54)',
  },
  title: {
    color: '#F6E6CC',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.05,
    textTransform: 'uppercase',
  },
  subtitle: {
    marginTop: 3,
    color: 'rgba(244, 223, 191, 0.9)',
    fontSize: 11,
    letterSpacing: 0.35,
  },
  stageSubtitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
});

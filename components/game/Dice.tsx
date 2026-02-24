import { urTheme, urTextures } from '@/constants/urTheme';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
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
  compact?: boolean;
}

interface TetrahedralDieProps {
  isOn: boolean;
  size?: number;
}

const TetrahedralDie: React.FC<TetrahedralDieProps> = ({ isOn, size = 38 }) => {
  const w = size;
  const h = size;
  const apex = `${w / 2},3`;
  const baseLeft = `2,${h - 4}`;
  const baseRight = `${w - 2},${h - 4}`;
  const baseCenter = `${w / 2},${h - 4}`;

  const leftFacePoints = `${apex} ${baseLeft} ${baseCenter}`;
  const rightFacePoints = `${apex} ${baseCenter} ${baseRight}`;

  const leftFillOn = '#1A3A7A';
  const rightFillOn = '#2A5AAE';
  const leftFillOff = '#A07840';
  const rightFillOff = '#C89858';
  const strokeColor = '#1A1208';

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} pointerEvents="none">
      <Polygon
        points={leftFacePoints}
        fill={isOn ? leftFillOn : leftFillOff}
        stroke={strokeColor}
        strokeWidth={1.2}
      />
      <Polygon
        points={rightFacePoints}
        fill={isOn ? rightFillOn : rightFillOff}
        stroke={strokeColor}
        strokeWidth={1.2}
      />
      <Line x1={w / 2} y1={3} x2={w / 2} y2={h - 4} stroke={strokeColor} strokeWidth={1} />
      <Polygon
        points={`${w / 2 + 4},${Math.floor(h * 0.28)} ${w - 8},${h - 10} ${w / 2 + 2},${h - 10}`}
        fill={isOn ? 'rgba(140,180,255,0.28)' : 'rgba(255,240,200,0.22)'}
        stroke="none"
      />
      {isOn && (
        <Circle cx={w / 2} cy={11} r={3.5} fill="#F2E8D5" stroke={strokeColor} strokeWidth={0.8} />
      )}
    </Svg>
  );
};

export const Dice: React.FC<DiceProps> = ({
  value,
  rolling,
  onRoll,
  canRoll,
  mode = 'panel',
  showNumericResult = true,
  compact = false,
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
      { rotateY: `${spin.value * 60}deg` },
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
  const dieSize = compact ? 28 : 38;
  const dieGap = compact ? 6 : 12;

  return (
    <TouchableOpacity onPress={onRoll} disabled={!canRoll || rolling} activeOpacity={0.9} style={styles.touchable}>
      <View
        style={[
          styles.card,
          compact && styles.compactCard,
          isStage ? styles.stageCard : styles.panelCard,
          compact && isStage && styles.compactStageCard,
          canRoll ? styles.cardActive : styles.cardLocked,
        ]}
      >
        <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.cardTexture} />
        <View style={styles.cardTopGlow} />
        <View style={styles.cardBorder} />
        <Animated.View style={[styles.readyHalo, readinessStyle]} />

        <Animated.View style={[styles.groundShadow, compact && styles.compactGroundShadow, groundShadowStyle]} />

        <Animated.View style={[styles.diceRow, compact && styles.compactDiceRow, { gap: dieGap }, diceRowStyle]}>
          {[0, 1, 2, 3].map((index) => {
            const isOn = value !== null && index < value;

            return (
              <View key={index} style={[styles.dieWrap, compact && styles.compactDieWrap]}>
                <TetrahedralDie isOn={isOn} size={dieSize} />
              </View>
            );
          })}
        </Animated.View>

        {showNumericResult && <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>}
        <Text style={[styles.subtitle, compact && styles.compactSubtitle, isStage && styles.stageSubtitle]}>{subtitle}</Text>
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
    minHeight: 143,
    borderRadius: urTheme.radii.pill,
  },
  compactCard: {
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.sm,
  },
  compactStageCard: {
    minHeight: 122,
  },
  cardActive: {
    backgroundColor: '#5A2E10',
    borderColor: 'rgba(200, 152, 30, 0.78)',
  },
  cardLocked: {
    backgroundColor: '#3A3228',
    borderColor: 'rgba(180, 160, 100, 0.32)',
    opacity: 0.72,
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
  compactGroundShadow: {
    width: 96,
    height: 18,
    top: 42,
  },
  diceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: urTheme.spacing.sm,
    marginTop: 2,
  },
  compactDiceRow: {
    marginBottom: urTheme.spacing.xs,
  },
  dieWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactDieWrap: {
    width: 28,
    height: 28,
  },
  title: {
    color: '#F6E6CC',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.05,
    textTransform: 'uppercase',
  },
  compactTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
  },
  subtitle: {
    marginTop: 3,
    color: 'rgba(244, 223, 191, 0.9)',
    fontSize: 11,
    letterSpacing: 0.35,
  },
  compactSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  stageSubtitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
});

import { urTheme, urTextures } from '@/constants/urTheme';
import { isRosette, isWarZone } from '@/logic/constants';
import { PlayerColor } from '@/logic/types';
import React, { useEffect, useMemo, useRef } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Polygon } from 'react-native-svg';
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

interface TileProps {
  row: number;
  col: number;
  piece?: { id: string; color: PlayerColor };
  isValidTarget?: boolean;
  isSelectedPiece?: boolean;
  isInteractive?: boolean;
  onPress?: () => void;
  highlightMode?: 'subtle' | 'theatrical';
  cellSize?: number;
}

const RosetteArtwork: React.FC<{ size: number }> = ({ size }) => {
  const cx = size / 2;
  const cy = size / 2;
  const petalRx = size * 0.18;
  const petalRy = size * 0.1;
  const petalOffset = size * 0.19;
  const colors = ['#2AA89A', '#D4702A', '#2AA89A', '#D4702A', '#2AA89A', '#D4702A', '#2AA89A', '#D4702A'];
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={styles.artwork} pointerEvents="none">
      <G>
        {angles.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const ex = cx + Math.cos(rad) * petalOffset;
          const ey = cy + Math.sin(rad) * petalOffset;
          return (
            <Ellipse
              key={i}
              cx={ex}
              cy={ey}
              rx={petalRx}
              ry={petalRy}
              fill={colors[i]}
              opacity={0.88}
              transform={`rotate(${angle}, ${ex}, ${ey})`}
            />
          );
        })}
        <Circle cx={cx} cy={cy} r={size * 0.14} fill="#F2E8D5" stroke="#C8981E" strokeWidth={1.2} />
        <Circle cx={cx} cy={cy} r={size * 0.05} fill="#1A1208" />
        <Circle cx={cx} cy={cy} r={size * 0.42} fill="none" stroke="#C8981E" strokeWidth={1} opacity={0.7} />
      </G>
    </Svg>
  );
};

const PipArtwork: React.FC<{ size: number }> = ({ size }) => {
  const positions = [
    { x: size * 0.33, y: size * 0.33 },
    { x: size * 0.67, y: size * 0.33 },
    { x: size * 0.33, y: size * 0.67 },
    { x: size * 0.67, y: size * 0.67 },
  ];
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={styles.artwork} pointerEvents="none">
      {positions.map((pos, i) => (
        <Circle key={i} cx={pos.x} cy={pos.y} r={size * 0.065} fill="rgba(90,60,30,0.52)" />
      ))}
    </Svg>
  );
};

const WarArtwork: React.FC<{ size: number }> = ({ size }) => {
  const half = size / 2;
  const d = size * 0.13;
  const diamonds = [
    { cx: half * 0.6, cy: half * 0.6 },
    { cx: half * 1.4, cy: half * 0.6 },
    { cx: half * 0.6, cy: half * 1.4 },
    { cx: half * 1.4, cy: half * 1.4 },
  ];

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={styles.artwork} pointerEvents="none">
      {diamonds.map((pos, i) => (
        <Polygon
          key={i}
          points={`${pos.cx},${pos.cy - d} ${pos.cx + d},${pos.cy} ${pos.cx},${pos.cy + d} ${pos.cx - d},${pos.cy}`}
          fill="rgba(60,30,10,0.38)"
        />
      ))}
    </Svg>
  );
};

export const Tile: React.FC<TileProps> = ({
  row,
  col,
  piece,
  isValidTarget = false,
  isSelectedPiece = false,
  isInteractive = false,
  onPress,
  highlightMode = 'theatrical',
  cellSize = 44,
}) => {
  const rosette = isRosette(row, col);
  const war = isWarZone(row, col);
  const pulse = useSharedValue(isValidTarget ? 1 : 0);
  const selectedPulse = useSharedValue(isSelectedPiece ? 1 : 0);
  const rosetteGlow = useSharedValue(rosette ? 0.2 : 0);
  const rosetteBurst = useSharedValue(0);
  const prevPieceId = useRef<string | null>(piece?.id ?? null);

  const tileSeed = useMemo(() => (row * 13 + col * 7) % 5, [col, row]);
  const toneOffset = tileSeed * 4;

  useEffect(() => {
    if (isValidTarget) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: highlightMode === 'theatrical' ? 520 : 900,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(0.45, {
            duration: highlightMode === 'theatrical' ? 520 : 900,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(pulse);
    pulse.value = withTiming(0, { duration: 180 });
  }, [highlightMode, isValidTarget, pulse]);

  useEffect(() => {
    if (isSelectedPiece) {
      selectedPulse.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 520, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.25, { duration: 520, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(selectedPulse);
    selectedPulse.value = withTiming(0, { duration: 180 });
  }, [isSelectedPiece, selectedPulse]);

  useEffect(() => {
    if (rosette) {
      rosetteGlow.value = withRepeat(
        withSequence(
          withTiming(0.52, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.18, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    rosetteGlow.value = 0;
  }, [rosette, rosetteGlow]);

  useEffect(() => {
    const prev = prevPieceId.current;
    const next = piece?.id ?? null;
    if (rosette && next && prev !== next) {
      rosetteBurst.value = withSequence(
        withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 360, easing: Easing.inOut(Easing.quad) }),
      );
    }
    prevPieceId.current = next;
  }, [piece?.id, rosette, rosetteBurst]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: highlightMode === 'theatrical' ? pulse.value : pulse.value * 0.6,
    transform: [{ scale: 0.9 + pulse.value * (highlightMode === 'theatrical' ? 0.26 : 0.14) }],
  }));

  const rosetteGlowStyle = useAnimatedStyle(() => ({
    opacity: rosetteGlow.value,
  }));

  const selectedPulseStyle = useAnimatedStyle(() => ({
    opacity: selectedPulse.value,
    transform: [{ scale: 0.93 + selectedPulse.value * 0.13 }],
  }));

  const rosetteBurstStyle = useAnimatedStyle(() => ({
    opacity: rosetteBurst.value * 0.8,
    transform: [{ scale: 0.82 + rosetteBurst.value * 0.7 }],
  }));

  const baseBackground = rosette
    ? `rgb(${178 + toneOffset}, ${122 + Math.floor(toneOffset / 2)}, ${52 + Math.floor(toneOffset / 3)})`
    : war
      ? `rgb(${168 + toneOffset}, ${110 + Math.floor(toneOffset / 2)}, ${52 + Math.floor(toneOffset / 3)})`
      : `rgb(${192 + toneOffset}, ${152 + Math.floor(toneOffset / 2)}, ${88 + Math.floor(toneOffset / 3)})`;

  const borderColor = rosette
    ? 'rgba(242, 205, 132, 0.74)'
    : war
      ? 'rgba(164, 110, 68, 0.5)'
      : 'rgba(128, 86, 55, 0.46)';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.88}
      style={[
        styles.tile,
        {
          backgroundColor: baseBackground,
          borderColor,
          borderWidth: rosette ? 1.8 : 1.1,
          opacity: isInteractive || piece ? 1 : 0.95,
        },
      ]}
    >
      <Image source={urTextures.wood} resizeMode="repeat" style={styles.tileTexture} />
      {rosette && <RosetteArtwork size={cellSize} />}
      {!rosette && war && <WarArtwork size={cellSize} />}
      {!rosette && !war && <PipArtwork size={cellSize} />}
      <View style={[styles.innerInset, rosette && styles.rosetteInset]} pointerEvents="none" />
      <View style={styles.edgeHighlight} pointerEvents="none" />
      <View style={styles.lowerShade} pointerEvents="none" />

      {rosette && <Animated.View style={[styles.rosetteGlow, rosetteGlowStyle]} pointerEvents="none" />}
      {rosette && <Animated.View style={[styles.rosetteBurst, rosetteBurstStyle]} pointerEvents="none" />}

      {isSelectedPiece && <Animated.View style={[styles.selectedRing, selectedPulseStyle]} pointerEvents="none" />}
      {isValidTarget && <Animated.View style={[styles.validRing, pulseStyle]} pointerEvents="none" />}

      {isValidTarget && !piece && <View style={styles.validDot} pointerEvents="none" />}

      {piece && (
        <View style={styles.pieceWrap}>
          <Piece
            color={piece.color}
            highlight={isSelectedPiece || isValidTarget}
            size="md"
            variant={piece.color === 'light' ? 'light' : 'dark'}
            state={isSelectedPiece ? 'active' : 'idle'}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: urTheme.radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  tileTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  artwork: {
    position: 'absolute',
  },
  innerInset: {
    ...StyleSheet.absoluteFillObject,
    margin: 4,
    borderRadius: urTheme.radii.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 233, 198, 0.16)',
  },
  rosetteInset: {
    borderColor: 'rgba(255, 212, 122, 0.24)',
  },
  edgeHighlight: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: '34%',
    borderTopLeftRadius: urTheme.radii.xs,
    borderTopRightRadius: urTheme.radii.xs,
    backgroundColor: 'rgba(255, 240, 205, 0.12)',
  },
  lowerShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    backgroundColor: 'rgba(13, 8, 6, 0.14)',
  },
  rosetteGlow: {
    ...StyleSheet.absoluteFillObject,
    margin: 2,
    borderRadius: urTheme.radii.xs,
    borderWidth: 1.2,
    borderColor: 'rgba(240, 192, 64, 0.82)',
    backgroundColor: 'rgba(240, 192, 64, 0.08)',
  },
  rosetteBurst: {
    ...StyleSheet.absoluteFillObject,
    margin: 1,
    borderRadius: urTheme.radii.xs,
    borderWidth: 1.4,
    borderColor: 'rgba(255, 224, 160, 0.72)',
  },
  selectedRing: {
    ...StyleSheet.absoluteFillObject,
    margin: 1,
    borderRadius: urTheme.radii.xs,
    borderWidth: 1.8,
    borderColor: 'rgba(240, 192, 64, 0.92)',
    backgroundColor: 'rgba(240, 192, 64, 0.12)',
  },
  validRing: {
    ...StyleSheet.absoluteFillObject,
    margin: 1,
    borderRadius: urTheme.radii.xs,
    borderWidth: 1.8,
    borderColor: 'rgba(240, 192, 64, 0.98)',
  },
  validDot: {
    width: 9,
    height: 9,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(250, 224, 156, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(83, 52, 24, 0.6)',
  },
  pieceWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

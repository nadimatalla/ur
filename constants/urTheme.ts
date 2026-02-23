import { ImageSourcePropType, Platform, TextStyle, ViewStyle } from 'react-native';

const serifFamily = Platform.select({
  ios: 'Times New Roman',
  android: 'serif',
  default: 'serif',
});

export const urTheme = {
  colors: {
    night: '#0B1F2A',
    ink: '#1C2229',
    tableOak: '#3E2A1F',
    tableWalnut: '#2B1B14',
    tableAsh: '#5A3C2D',
    lapis: '#1E5AA8',
    lapisBright: '#3D7DFF',
    gold: '#D9A441',
    amber: '#B86A2A',
    cedar: '#7C4A2D',
    sand: '#D7C1A3',
    ivory: '#F1E6D0',
    obsidian: '#0D0F12',
    glow: '#6FB8FF',
    smoke: '#2E3238',
    parchment: '#E9D5B8',
    ember: '#F0AE5A',
  },
  radii: { xs: 6, sm: 10, md: 16, lg: 24, pill: 999 },
  spacing: { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 },
  layout: {
    stage: {
      maxWidth: 1040,
      sideRailMin: 200,
      sideRailMax: 320,
      gutter: 18,
    },
    rail: {
      tokenSize: 44,
      overlap: 16,
    },
    boardMax: 760,
  },
  materials: {
    woodDark: '#12263A',
    woodMid: '#1E3550',
    inlayGold: '#C58D3C',
    lapis: '#1B4D8F',
    obsidian: '#101318',
  },
  motion: {
    duration: {
      fast: 160,
      base: 320,
      slow: 680,
      epic: 1200,
    },
    spring: {
      tight: { mass: 0.45, damping: 10, stiffness: 210 },
      game: { mass: 0.58, damping: 8, stiffness: 180 },
      settle: { mass: 0.62, damping: 11, stiffness: 155 },
    },
    curves: {
      pulse: [0.22, 0.61, 0.36, 1] as const,
      sweep: [0.19, 1, 0.22, 1] as const,
    },
  },
  fx: {
    vignette: 0.34,
    ambientGlow: 0.2,
    focusGlow: 0.72,
    pulseMin: 0.24,
    pulseMax: 0.92,
  },
  shadow: {
    soft: {
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    deep: {
      shadowColor: '#000',
      shadowOpacity: 0.28,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
  },
} as const;

export const urShadows: Record<'soft' | 'deep', ViewStyle> = {
  soft: urTheme.shadow.soft,
  deep: urTheme.shadow.deep,
};

export const urTypography: Record<'title' | 'subtitle' | 'label', TextStyle> = {
  title: {
    fontFamily: serifFamily,
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: serifFamily,
    letterSpacing: 0.6,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
};

export const urTextures: Record<
  'wood' | 'woodDark' | 'rosette' | 'goldInlay' | 'border' | 'lapisMosaic',
  ImageSourcePropType
> = {
  wood: require('../assets/textures/texture-wood-grain.png'),
  woodDark: require('../assets/textures/texture-wood-grain-dark.png'),
  rosette: require('../assets/textures/texture-rosette-pattern.png'),
  goldInlay: require('../assets/textures/texture-inlaid-gold-pattern.png'),
  border: require('../assets/textures/texture-gold-inlay-border-weathered.png'),
  lapisMosaic: require('../assets/textures/texture-lapis-mosaic.png'),
};

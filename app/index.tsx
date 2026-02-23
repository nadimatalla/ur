import { Button } from '@/components/ui/Button';
import { HowToPlayModal } from '@/components/HowToPlayModal';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function Home() {
  const router = useRouter();
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);

  return (
    <View style={styles.screen}>
      <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.texture} />
      <View style={styles.topGlow} />
      <View style={styles.midGlow} />
      <View style={styles.bottomShade} />

      <View style={styles.hero}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Royal Archive</Text>
        </View>
        <Text style={styles.title}>Royal Game of Ur</Text>
        <Text style={styles.subtitle}>An ancient race across carved lanes, sacred rosettes, and dramatic turns.</Text>
      </View>

      <View style={styles.panel}>
        <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.panelTexture} />
        <View style={styles.panelBorder} />

        <View style={styles.buttonStack}>
          <Button title="Play Local vs Bot" onPress={() => router.push('/(game)/lobby?mode=bot')} />
          <Button title="Online Multiplayer" variant="outline" onPress={() => router.push('/(game)/lobby?mode=online')} />
          <Button title="Watch tutorial" variant="outline" onPress={() => router.push('/tutorial/watch' as never)} />
          <Button title="How to play" variant="secondary" onPress={() => setShowHowToPlay(true)} />
        </View>
      </View>

      <HowToPlayModal visible={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: urTheme.spacing.lg,
    backgroundColor: urTheme.colors.night,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '28%',
    backgroundColor: 'rgba(180, 120, 30, 0.14)',
  },
  midGlow: {
    position: 'absolute',
    top: '34%',
    left: 0,
    right: 0,
    height: '22%',
    backgroundColor: 'rgba(140, 80, 20, 0.12)',
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '48%',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  hero: {
    alignItems: 'center',
    marginBottom: urTheme.spacing.xl + 10,
    maxWidth: 560,
  },
  badge: {
    paddingHorizontal: urTheme.spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(13, 15, 18, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.6)',
    marginBottom: urTheme.spacing.sm,
  },
  badgeText: {
    ...urTypography.label,
    fontSize: 10,
    color: urTheme.colors.parchment,
  },
  title: {
    ...urTypography.title,
    fontSize: 46,
    lineHeight: 56,
    color: '#F7E9D2',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: urTheme.spacing.sm,
    textAlign: 'center',
    color: 'rgba(239, 224, 198, 0.82)',
    fontSize: 17,
    lineHeight: 24,
  },
  panel: {
    width: '100%',
    maxWidth: 460,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 164, 65, 0.74)',
    overflow: 'hidden',
    backgroundColor: 'rgba(13, 15, 18, 0.62)',
    padding: urTheme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 10,
  },
  panelTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  panelBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 230, 181, 0.24)',
  },
  buttonStack: {
    gap: urTheme.spacing.sm,
  },
});

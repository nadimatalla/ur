import { Button } from '@/components/ui/Button';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { TutorialTeachingStep, TutorialUiTarget } from '@/tutorials/tutorialTypes';
import React from 'react';
import { Image, Modal as RNModal, ScrollView, StyleSheet, Text, View } from 'react-native';

interface TutorialModalProps {
  visible: boolean;
  step: TutorialTeachingStep | null;
  onContinue: () => void;
  onBack?: () => void;
}

const targetLabels: Record<TutorialUiTarget, string> = {
  turnBanner: 'Turn indicator',
  dice: 'Dice area',
  pieceSelect: 'Board highlights and piece selection',
  board: 'Board',
  log: 'Move log',
  controls: 'Replay controls',
};

const BulletList = ({ items }: { items: string[] }) => (
  <View style={styles.listWrap}>
    {items.map((item, index) => (
      <View key={`${item}-${index}`} style={styles.bulletRow}>
        <View style={styles.bulletDot} />
        <Text style={styles.bulletText}>{item}</Text>
      </View>
    ))}
  </View>
);

export const TutorialModal: React.FC<TutorialModalProps> = ({ visible, step, onContinue, onBack }) => {
  if (!step) return null;

  const targetLabel = step.kind === 'UI_HINT' ? targetLabels[step.target] : step.focus ? targetLabels[step.focus] : null;

  return (
    <RNModal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.texture} />
          <Image source={urTextures.border} resizeMode="repeat" style={styles.borderTexture} />
          <View style={styles.sheetGlow} />
          <View style={styles.border} />

          <Text style={styles.title}>{step.title}</Text>
          {targetLabel ? <Text style={styles.targetLabel}>Look at: {targetLabel}</Text> : null}

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
            <Text style={styles.sectionTitle}>Rule</Text>
            <BulletList items={step.content.rule} />

            <Text style={styles.sectionTitle}>What to watch for</Text>
            <BulletList items={step.content.watchFor} />

            <Text style={styles.sectionTitle}>Strategy tip</Text>
            <Text style={styles.tipText}>{step.content.strategyTip}</Text>
          </ScrollView>

          <View style={styles.buttonRow}>
            {onBack ? (
              <View style={styles.backButtonWrap}>
                <Button title="Back" variant="outline" onPress={onBack} />
              </View>
            ) : null}
            <View style={styles.continueButtonWrap}>
              <Button title="Continue" onPress={onContinue} />
            </View>
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
    maxWidth: 520,
    maxHeight: '80%',
    borderRadius: urTheme.radii.lg,
    overflow: 'hidden',
    backgroundColor: '#3B2416',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 164, 65, 0.7)',
    padding: urTheme.spacing.lg,
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
    height: '34%',
    backgroundColor: 'rgba(255, 219, 164, 0.14)',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(252, 225, 177, 0.28)',
  },
  title: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
  targetLabel: {
    marginTop: 6,
    textAlign: 'center',
    color: 'rgba(234, 218, 190, 0.88)',
    fontSize: 12,
  },
  scroll: {
    marginTop: urTheme.spacing.md,
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: urTheme.spacing.xs,
    gap: urTheme.spacing.xs,
  },
  sectionTitle: {
    ...urTypography.label,
    color: '#F3D9A6',
    fontSize: 12,
    marginTop: 2,
  },
  listWrap: {
    gap: 8,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F6C26A',
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    color: 'rgba(247, 229, 203, 0.94)',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  tipText: {
    color: 'rgba(229, 244, 255, 0.94)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: urTheme.spacing.xs,
  },
  buttonRow: {
    marginTop: urTheme.spacing.md,
    flexDirection: 'row',
    gap: urTheme.spacing.sm,
  },
  backButtonWrap: {
    flex: 1,
  },
  continueButtonWrap: {
    flex: 1.2,
  },
});

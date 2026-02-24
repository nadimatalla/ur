import { HOW_TO_PLAY_FINAL_NOTE, HOW_TO_PLAY_SECTIONS, HOW_TO_PLAY_TITLE } from '@/content/howToPlay';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import React from 'react';
import { Image, Modal as RNModal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './ui/Button';

interface HowToPlayModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  visible,
  onClose,
  title = HOW_TO_PLAY_TITLE,
}) => {
  return (
    <RNModal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close how to play instructions"
        />

        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']} pointerEvents="box-none">
          <View pointerEvents="box-none" style={styles.centerWrap}>
            <View style={styles.sheet} accessibilityViewIsModal>
              <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.texture} />
              <Image source={urTextures.border} resizeMode="repeat" style={styles.borderTexture} />
              <View style={styles.sheetGlow} />
              <View style={styles.border} />

              <View style={styles.headerRow}>
                <Text style={styles.title}>{title}</Text>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [styles.closeIconButton, pressed && styles.closeIconButtonPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  hitSlop={8}
                >
                  <Text style={styles.closeIconLabel}>X</Text>
                </Pressable>
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
              >
                {HOW_TO_PLAY_SECTIONS.map((section) => (
                  <View key={section.heading} style={styles.section}>
                    <Text style={styles.sectionHeading}>{section.heading}</Text>
                    {section.items.map((item) => (
                      <View key={item} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>{'\u2022'}</Text>
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ))}

                <View style={styles.noteWrap}>
                  <Text style={styles.noteText}>{HOW_TO_PLAY_FINAL_NOTE}</Text>
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Button title="Close" variant="outline" onPress={onClose} />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 12, 0.28)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 7, 12, 0.62)',
  },
  safeArea: {
    flex: 1,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.md,
  },
  sheet: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '90%',
    borderRadius: urTheme.radii.lg,
    overflow: 'hidden',
    backgroundColor: '#2E1C12',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 164, 65, 0.74)',
    paddingHorizontal: urTheme.spacing.lg,
    paddingTop: urTheme.spacing.lg,
    paddingBottom: urTheme.spacing.md,
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
    opacity: 0.14,
  },
  sheetGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '28%',
    backgroundColor: 'rgba(255, 223, 170, 0.16)',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(252, 225, 177, 0.28)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
    marginBottom: urTheme.spacing.sm,
  },
  title: {
    ...urTypography.title,
    flex: 1,
    color: urTheme.colors.parchment,
    fontSize: 26,
    lineHeight: 32,
  },
  closeIconButton: {
    width: 34,
    height: 34,
    borderRadius: urTheme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.35)',
    backgroundColor: 'rgba(12, 15, 18, 0.38)',
  },
  closeIconButtonPressed: {
    opacity: 0.78,
  },
  closeIconLabel: {
    color: urTheme.colors.parchment,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: urTheme.spacing.sm,
  },
  section: {
    marginBottom: urTheme.spacing.md,
  },
  sectionHeading: {
    ...urTypography.subtitle,
    color: '#F3DFBE',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 8,
    fontWeight: '700',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingRight: urTheme.spacing.xs,
  },
  bulletDot: {
    width: 18,
    color: 'rgba(244, 210, 152, 0.95)',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  bulletText: {
    flex: 1,
    color: 'rgba(247, 229, 203, 0.94)',
    fontSize: 14,
    lineHeight: 21,
  },
  noteWrap: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(252, 225, 177, 0.18)',
    paddingTop: urTheme.spacing.sm,
  },
  noteText: {
    color: 'rgba(241, 232, 216, 0.84)',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: Platform.OS === 'android' ? 'normal' : 'italic',
  },
  footer: {
    marginTop: urTheme.spacing.sm,
  },
});

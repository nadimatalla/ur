import { HowToPlayModal } from '@/components/HowToPlayModal';
import { Board } from '@/components/game/Board';
import { Dice } from '@/components/game/Dice';
import { EdgeScore } from '@/components/game/EdgeScore';
import { GameStageHUD } from '@/components/game/GameStageHUD';
import { PieceRail } from '@/components/game/PieceRail';
import { TutorialControls } from '@/components/tutorial/TutorialControls';
import { TutorialModal } from '@/components/tutorial/TutorialModal';
import { Button } from '@/components/ui/Button';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { buildTutorialFrames, describeTutorialActionStep, describeTutorialStep } from '@/tutorials/tutorialEngine';
import { TutorialStep, TutorialTeachingStep, TutorialUiTarget } from '@/tutorials/tutorialTypes';
import { WATCH_TUTORIAL_SCRIPT } from '@/tutorials/watchTutorialScript';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const PLAYER_PERSPECTIVE = 'light' as const;

const isTeachingStep = (step: TutorialStep): step is TutorialTeachingStep => step.kind === 'PAUSE' || step.kind === 'UI_HINT';

const getTeachingFocus = (step: TutorialTeachingStep | null): TutorialUiTarget | null => {
  if (!step) return null;
  if (step.kind === 'UI_HINT') return step.target;
  return step.focus ?? null;
};

const getAutoAdvanceDelay = (step: TutorialStep, speed: 1 | 2) => {
  const base = step.kind === 'MOVE' ? 900 : step.kind === 'ROLL' ? 850 : 420;
  return Math.round(base / speed);
};

export default function WatchTutorialScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [speed, setSpeed] = React.useState<1 | 2>(1);
  const [activeModalStep, setActiveModalStep] = React.useState<TutorialTeachingStep | null>(null);
  const [rollingVisual, setRollingVisual] = React.useState(false);
  const resumeAfterModalRef = React.useRef(false);

  const tutorialBuild = React.useMemo(() => {
    try {
      return {
        frames: buildTutorialFrames(WATCH_TUTORIAL_SCRIPT),
        error: null as Error | null,
      };
    } catch (error) {
      console.error(error);
      return {
        frames: null,
        error: error instanceof Error ? error : new Error('Failed to build tutorial frames'),
      };
    }
  }, []);

  const totalSteps = WATCH_TUTORIAL_SCRIPT.length;

  const currentFrame = tutorialBuild.frames ? tutorialBuild.frames[stepIndex] : null;
  const currentFocus = getTeachingFocus(activeModalStep);
  const controlsLocked = activeModalStep !== null;
  const isCompact = width < 720;

  const advanceStep = React.useCallback(() => {
    if (!tutorialBuild.frames) return;
    if (activeModalStep || stepIndex >= totalSteps) return;

    const step = WATCH_TUTORIAL_SCRIPT[stepIndex];
    const shouldResumeAfterModal = isPlaying;

    setStepIndex((prev) => Math.min(prev + 1, totalSteps));

    if (isTeachingStep(step)) {
      resumeAfterModalRef.current = shouldResumeAfterModal;
      setIsPlaying(false);
      setActiveModalStep(step);
    }
  }, [activeModalStep, isPlaying, stepIndex, totalSteps, tutorialBuild.frames]);

  const handleContinueModal = React.useCallback(() => {
    const shouldResume = resumeAfterModalRef.current;
    resumeAfterModalRef.current = false;
    setActiveModalStep(null);
    if (shouldResume && stepIndex < totalSteps) {
      setIsPlaying(true);
    }
  }, [stepIndex, totalSteps]);

  const handleBackStep = React.useCallback(() => {
    if (controlsLocked) return;
    setIsPlaying(false);
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, [controlsLocked]);

  const handleNextStep = React.useCallback(() => {
    if (controlsLocked) return;
    setIsPlaying(false);
    advanceStep();
  }, [advanceStep, controlsLocked]);

  const handleRestart = React.useCallback(() => {
    resumeAfterModalRef.current = false;
    setIsPlaying(false);
    setActiveModalStep(null);
    setRollingVisual(false);
    setStepIndex(0);
  }, []);

  const handleTogglePlay = React.useCallback(() => {
    if (controlsLocked || stepIndex >= totalSteps) return;
    setIsPlaying((prev) => !prev);
  }, [controlsLocked, stepIndex, totalSteps]);

  React.useEffect(() => {
    if (!tutorialBuild.frames) return;
    if (!isPlaying || controlsLocked || stepIndex >= totalSteps) return;

    const nextStep = WATCH_TUTORIAL_SCRIPT[stepIndex];
    const timer = setTimeout(() => {
      advanceStep();
    }, getAutoAdvanceDelay(nextStep, speed));

    return () => clearTimeout(timer);
  }, [advanceStep, controlsLocked, isPlaying, speed, stepIndex, totalSteps, tutorialBuild.frames]);

  React.useEffect(() => {
    if (stepIndex >= totalSteps) {
      setIsPlaying(false);
    }
  }, [stepIndex, totalSteps]);

  React.useEffect(() => {
    if (stepIndex === 0) {
      setRollingVisual(false);
      return;
    }

    const lastStep = WATCH_TUTORIAL_SCRIPT[stepIndex - 1];
    if (lastStep.kind !== 'ROLL') {
      setRollingVisual(false);
      return;
    }

    setRollingVisual(true);
    const timer = setTimeout(() => {
      setRollingVisual(false);
    }, Math.round(460 / speed));

    return () => clearTimeout(timer);
  }, [speed, stepIndex]);

  const recentTutorialLog = React.useMemo(() => {
    const entries: string[] = [];
    for (let index = 0; index < stepIndex; index += 1) {
      const entry = describeTutorialActionStep(WATCH_TUTORIAL_SCRIPT[index]);
      if (entry) entries.push(entry);
    }
    return entries.slice(-5).reverse();
  }, [stepIndex]);

  if (!tutorialBuild.frames || !currentFrame) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: 'Tutorial (Watch)' }} />
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Tutorial failed to load</Text>
          <Text style={styles.errorText}>{tutorialBuild.error?.message ?? 'Unknown error'}</Text>
          <View style={styles.errorButtonWrap}>
            <Button title="Back to Home" onPress={() => router.replace('/')} />
          </View>
        </View>
      </View>
    );
  }

  const gameState = currentFrame.gameState;
  const isMyTurn = gameState.currentTurn === PLAYER_PERSPECTIVE;
  const canRoll = isMyTurn && gameState.phase === 'rolling';
  const displayRollValue = gameState.rollValue ?? currentFrame.displayRollValue;

  const lightReserve = gameState.light.pieces.filter((piece) => !piece.isFinished && piece.position === -1).length;
  const darkReserve = gameState.dark.pieces.filter((piece) => !piece.isFinished && piece.position === -1).length;

  const highlight = (target: TutorialUiTarget) => currentFocus === target;

  const helpButton = (
    <Pressable
      onPress={() => setShowHowToPlay(true)}
      accessibilityRole="button"
      accessibilityLabel="Open how to play instructions"
      style={({ pressed }) => [styles.headerHelpButton, pressed && styles.headerHelpButtonPressed]}
    >
      <Text style={styles.headerHelpLabel}>Help</Text>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Tutorial (Watch)', headerRight: () => helpButton }} />

      <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.tableGrainPrimary} />
      <Image source={urTextures.wood} resizeMode="repeat" style={styles.tableGrainSecondary} />
      <View style={styles.tableTopLight} />
      <View style={styles.tableBottomShade} />
      <View style={styles.tableVignetteOuter} />
      <View style={styles.tableVignetteInner} />
      <View style={styles.tableSoftSpot} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.stageWrap}>
          <View style={styles.topActionsRow}>
            <View style={styles.tutorialBadgeWrap}>
              <Text style={styles.tutorialBadge}>Deterministic Replay Tutorial</Text>
              <Text style={styles.tutorialSubtitle}>
                {stepIndex >= totalSteps ? 'Tutorial complete' : `Next: ${describeTutorialStep(WATCH_TUTORIAL_SCRIPT[stepIndex])}`}
              </Text>
            </View>
            <View style={styles.skipButtonWrap}>
              <Button title="Skip tutorial" variant="outline" onPress={() => router.replace('/')} />
            </View>
          </View>

          <View style={styles.scoreRow}>
            <EdgeScore label="Dark Score" value={`${gameState.dark.finishedCount}/7`} active={!isMyTurn} />
            <EdgeScore label="Light Score" value={`${gameState.light.finishedCount}/7`} active={isMyTurn} align="right" />
          </View>

          <PieceRail label="Dark Reserve" color="dark" tokenVariant="dark" reserveCount={darkReserve} active={!isMyTurn} />

          <View style={[styles.focusWrap, highlight('turnBanner') && styles.focusWrapActive]}>
            <GameStageHUD isMyTurn={isMyTurn} canRoll={canRoll} phase={gameState.phase} />
          </View>

          <View style={[styles.boardCard, (highlight('board') || highlight('pieceSelect')) && styles.focusWrapActive]}>
            <View style={styles.boardShadow} />
            <Board
              showRailHints
              highlightMode="theatrical"
              boardScale={isCompact ? 0.95 : 1}
              gameStateOverride={gameState}
              validMovesOverride={currentFrame.validMoves}
              playerColorOverride={PLAYER_PERSPECTIVE}
              onMakeMoveOverride={() => {}}
              allowInteraction={false}
            />
          </View>

          <PieceRail label="Light Reserve" color="light" tokenVariant="light" reserveCount={lightReserve} active={isMyTurn} />

          <View style={[styles.focusWrap, highlight('dice') && styles.focusWrapActive]}>
            <Dice value={displayRollValue} rolling={rollingVisual} onRoll={() => {}} canRoll={false} mode="stage" />
          </View>

          <View style={[styles.focusWrap, highlight('controls') && styles.focusWrapActive]}>
            <TutorialControls
              steps={WATCH_TUTORIAL_SCRIPT}
              stepIndex={stepIndex}
              isPlaying={isPlaying}
              speed={speed}
              controlsLocked={controlsLocked}
              onTogglePlay={handleTogglePlay}
              onNext={handleNextStep}
              onBack={handleBackStep}
              onRestart={handleRestart}
              onToggleSpeed={() => setSpeed((prev) => (prev === 1 ? 2 : 1))}
            />
          </View>

          <View style={[styles.historyStrip, highlight('log') && styles.focusWrapActive]}>
            <Text style={styles.historyTitle}>Tutorial Log</Text>
            {recentTutorialLog.length === 0 ? (
              <Text style={styles.historyEntryMuted}>Replay ready. Press Play to start.</Text>
            ) : (
              recentTutorialLog.map((entry, index) => (
                <Text key={`${entry}-${index}`} style={styles.historyEntry}>
                  {entry}
                </Text>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <TutorialModal visible={Boolean(activeModalStep)} step={activeModalStep} onContinue={handleContinueModal} />
      <HowToPlayModal visible={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: urTheme.colors.tableWalnut,
  },
  tableGrainPrimary: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  tableGrainSecondary: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
    transform: [{ rotate: '180deg' }],
  },
  tableTopLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(255, 213, 166, 0.16)',
  },
  tableBottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '54%',
    backgroundColor: 'rgba(12, 6, 4, 0.44)',
  },
  tableVignetteOuter: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(0, 0, 0, 0.24)',
    borderWidth: 24,
  },
  tableVignetteInner: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(0, 0, 0, 0.13)',
    borderWidth: 10,
  },
  tableSoftSpot: {
    position: 'absolute',
    top: '28%',
    left: '16%',
    width: '68%',
    height: '36%',
    borderRadius: urTheme.radii.lg,
    backgroundColor: 'rgba(255, 238, 211, 0.06)',
  },
  scrollContent: {
    paddingHorizontal: urTheme.spacing.md,
    paddingTop: urTheme.spacing.md,
    paddingBottom: urTheme.spacing.xl,
    alignItems: 'center',
  },
  stageWrap: {
    width: '100%',
    maxWidth: urTheme.layout.stage.maxWidth,
    gap: urTheme.spacing.md,
  },
  topActionsRow: {
    flexDirection: 'row',
    gap: urTheme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  tutorialBadgeWrap: {
    flex: 1,
    minWidth: 220,
    gap: 2,
  },
  tutorialBadge: {
    ...urTypography.label,
    color: 'rgba(241, 230, 208, 0.95)',
    fontSize: 11,
  },
  tutorialSubtitle: {
    color: 'rgba(235, 223, 202, 0.86)',
    fontSize: 12,
    lineHeight: 18,
  },
  skipButtonWrap: {
    width: 150,
    maxWidth: '100%',
  },
  scoreRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
  },
  boardCard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 2,
    marginBottom: 2,
    borderRadius: urTheme.radii.md,
  },
  boardShadow: {
    position: 'absolute',
    width: '84%',
    height: 44,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    top: '52%',
    zIndex: 0,
  },
  focusWrap: {
    width: '100%',
    borderRadius: urTheme.radii.md,
  },
  focusWrapActive: {
    borderWidth: 1.2,
    borderColor: 'rgba(111, 184, 255, 0.92)',
    shadowColor: urTheme.colors.glow,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
    backgroundColor: 'rgba(111, 184, 255, 0.05)',
  },
  historyStrip: {
    width: '100%',
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.44)',
    backgroundColor: 'rgba(9, 14, 20, 0.7)',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    overflow: 'hidden',
    gap: 4,
  },
  historyTitle: {
    ...urTypography.label,
    fontSize: 11,
    color: urTheme.colors.parchment,
  },
  historyEntry: {
    color: 'rgba(239, 228, 208, 0.88)',
    fontSize: 12,
    lineHeight: 17,
  },
  historyEntryMuted: {
    color: 'rgba(239, 228, 208, 0.64)',
    fontSize: 12,
    lineHeight: 17,
  },
  headerHelpButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.78)',
    backgroundColor: 'rgba(13, 15, 18, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerHelpButtonPressed: {
    opacity: 0.8,
  },
  headerHelpLabel: {
    ...urTypography.label,
    color: urTheme.colors.parchment,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: urTheme.spacing.lg,
    gap: urTheme.spacing.sm,
  },
  errorTitle: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 28,
    textAlign: 'center',
  },
  errorText: {
    color: 'rgba(247, 229, 203, 0.92)',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  errorButtonWrap: {
    width: '100%',
    maxWidth: 260,
    marginTop: urTheme.spacing.sm,
  },
});

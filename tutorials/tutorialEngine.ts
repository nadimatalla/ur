import { applyMove as applyEngineMove, createInitialState, getValidMoves } from '@/logic/engine';
import { GameState, MoveAction, PlayerColor } from '@/logic/types';
import { TutorialActionStep, TutorialFrame, TutorialStep } from './tutorialTypes';

interface TutorialRuntime {
  gameState: GameState;
  validMoves: MoveAction[];
  displayRollValue: number | null;
}

const cloneGameState = (state: GameState): GameState => JSON.parse(JSON.stringify(state)) as GameState;

const cloneRuntimeFrame = (runtime: TutorialRuntime): TutorialFrame => ({
  gameState: cloneGameState(runtime.gameState),
  validMoves: runtime.validMoves.map((move) => ({ ...move })),
  displayRollValue: runtime.displayRollValue,
});

const flipPlayer = (player: PlayerColor): PlayerColor => (player === 'light' ? 'dark' : 'light');

const playerLabel = (player: PlayerColor) => (player === 'light' ? 'Light' : 'Dark');

const isTutorialActionStep = (step: TutorialStep): step is TutorialActionStep =>
  step.kind === 'ROLL' || step.kind === 'MOVE';

const assertStep = (condition: boolean, step: TutorialStep, index: number, message: string) => {
  if (condition) return;
  throw new Error(`[Tutorial][${index + 1}/${step.id}] ${message}`);
};

const applyRollValue = (
  runtime: TutorialRuntime,
  step: Extract<TutorialStep, { kind: 'ROLL' }>,
  index: number,
): TutorialRuntime => {
  const state = runtime.gameState;

  assertStep(state.phase === 'rolling', step, index, `Expected rolling phase, received ${state.phase}`);
  assertStep(state.currentTurn === step.player, step, index, `Expected ${step.player} to roll, got ${state.currentTurn}`);

  const rolledState = cloneGameState(state);
  rolledState.rollValue = step.value;
  rolledState.phase = 'moving';

  const validMoves = getValidMoves(rolledState, step.value);
  const noMoves = validMoves.length === 0;

  if (typeof step.expectNoMoves === 'boolean') {
    assertStep(noMoves === step.expectNoMoves, step, index, `expectNoMoves=${step.expectNoMoves} mismatch`);
  }

  if (noMoves) {
    const skippedState = cloneGameState(rolledState);
    const currentPlayer = skippedState.currentTurn;
    skippedState.currentTurn = flipPlayer(skippedState.currentTurn);
    skippedState.phase = 'rolling';
    skippedState.rollValue = null;
    skippedState.history.push(`${currentPlayer} rolled ${step.value} but had no moves.`);

    return {
      gameState: skippedState,
      validMoves: [],
      displayRollValue: step.value,
    };
  }

  return {
    gameState: rolledState,
    validMoves,
    displayRollValue: step.value,
  };
};

const applyMoveStep = (
  runtime: TutorialRuntime,
  step: Extract<TutorialStep, { kind: 'MOVE' }>,
  index: number,
): TutorialRuntime => {
  const state = runtime.gameState;

  assertStep(state.phase === 'moving', step, index, `Expected moving phase, received ${state.phase}`);
  assertStep(state.currentTurn === step.player, step, index, `Expected ${step.player} to move, got ${state.currentTurn}`);

  const legalMoves = runtime.validMoves.length > 0 ? runtime.validMoves : getValidMoves(state, state.rollValue ?? 0);
  const matchingMove = legalMoves.find((move) => {
    if (move.pieceId !== step.pieceId) return false;
    if (move.toIndex !== step.toIndex) return false;
    if (typeof step.fromIndex === 'number' && move.fromIndex !== step.fromIndex) return false;
    return true;
  });

  assertStep(Boolean(matchingMove), step, index, `Illegal move ${step.pieceId} -> ${step.toIndex}`);

  const nextState = applyEngineMove(state, matchingMove as MoveAction);

  return {
    gameState: nextState,
    validMoves: [],
    displayRollValue: null,
  };
};

export const buildTutorialFrames = (steps: readonly TutorialStep[]): TutorialFrame[] => {
  const frames: TutorialFrame[] = [];
  let runtime: TutorialRuntime = {
    gameState: createInitialState(),
    validMoves: [],
    displayRollValue: null,
  };

  // frames[0] is the initial board; frames[n] is the state after consuming steps[n - 1].
  frames.push(cloneRuntimeFrame(runtime));

  steps.forEach((step, index) => {
    if (step.kind === 'ROLL') {
      runtime = applyRollValue(runtime, step, index);
    } else if (step.kind === 'MOVE') {
      runtime = applyMoveStep(runtime, step, index);
    } else {
      runtime = {
        ...runtime,
        gameState: cloneGameState(runtime.gameState),
        validMoves: runtime.validMoves.map((move) => ({ ...move })),
      };
    }

    frames.push(cloneRuntimeFrame(runtime));
  });

  return frames;
};

const shortPiece = (pieceId: string) => {
  const [side, index] = pieceId.split('-');
  const prefix = side === 'dark' ? 'D' : 'L';
  return `${prefix}${index}`;
};

export const describeTutorialStep = (step: TutorialStep): string => {
  if (step.timelineLabel) return step.timelineLabel;

  switch (step.kind) {
    case 'ROLL':
      return `${playerLabel(step.player)} rolls ${step.value}`;
    case 'MOVE':
      return `${playerLabel(step.player)} moves ${shortPiece(step.pieceId)} to ${step.toIndex}`;
    case 'PAUSE':
      return step.title;
    case 'UI_HINT':
      return `UI: ${step.title}`;
    default:
      return '';
  }
};

export const describeTutorialActionStep = (step: TutorialStep): string | null => {
  if (!isTutorialActionStep(step)) return null;
  const base = describeTutorialStep(step);
  return step.note ? `${base} - ${step.note}` : base;
};

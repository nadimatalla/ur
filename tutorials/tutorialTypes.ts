import { GameState, MoveAction, PlayerColor } from '@/logic/types';

export type TutorialRollValue = 0 | 1 | 2 | 3 | 4;

export type TutorialUiTarget = 'turnBanner' | 'dice' | 'pieceSelect' | 'board' | 'log' | 'controls';

export interface TutorialLessonContent {
  rule: string[];
  watchFor: string[];
  strategyTip: string;
}

interface TutorialStepBase {
  id: string;
  note?: string;
  timelineLabel?: string;
}

export interface TutorialRollStep extends TutorialStepBase {
  kind: 'ROLL';
  player: PlayerColor;
  value: TutorialRollValue;
  expectNoMoves?: boolean;
}

export interface TutorialMoveStep extends TutorialStepBase {
  kind: 'MOVE';
  player: PlayerColor;
  pieceId: string;
  toIndex: number;
  fromIndex?: number;
}

export interface TutorialPauseStep extends TutorialStepBase {
  kind: 'PAUSE';
  title: string;
  content: TutorialLessonContent;
  focus?: TutorialUiTarget;
}

export interface TutorialUiHintStep extends TutorialStepBase {
  kind: 'UI_HINT';
  target: TutorialUiTarget;
  title: string;
  content: TutorialLessonContent;
}

export type TutorialStep = TutorialRollStep | TutorialMoveStep | TutorialPauseStep | TutorialUiHintStep;

export type TutorialTeachingStep = TutorialPauseStep | TutorialUiHintStep;
export type TutorialActionStep = TutorialRollStep | TutorialMoveStep;

export interface TutorialFrame {
  gameState: GameState;
  validMoves: MoveAction[];
  displayRollValue: number | null;
}

import { TutorialLessonContent, TutorialStep } from './tutorialTypes';

const lesson = (rule: string[], watchFor: string[], strategyTip: string): TutorialLessonContent => ({
  rule,
  watchFor,
  strategyTip,
});

// Authoring note: keep deterministic game progression in ROLL/MOVE steps and insert PAUSE/UI_HINT
// steps wherever you want the replay to stop for teaching content. PAUSE/UI_HINT steps do not change game state.
export const WATCH_TUTORIAL_SCRIPT: TutorialStep[] = [
  {
    id: 'intro-board-basics',
    kind: 'PAUSE',
    title: 'Welcome: Board Basics',
    focus: 'board',
    content: lesson(
      [
        'Goal: bear off all 7 of your pieces before your opponent.',
        'Each side follows its own lane, then both pieces fight over the shared middle row.',
      ],
      [
        'This is a watch-only replay: the moves and dice are scripted on purpose.',
        'You can pause, step forward/back, restart, or skip at any time.',
      ],
      'Think in races and skirmishes at the same time: score pieces, but protect the middle lane.',
    ),
  },
  {
    id: 'ui-turn-banner',
    kind: 'UI_HINT',
    target: 'turnBanner',
    title: 'Turn Indicator',
    content: lesson(
      [
        'The banner shows whose turn it is and what action comes next (roll or move).',
        'In online games, waiting just means your opponent is acting or the server is syncing the next state.',
      ],
      [
        'When the banner flips, the glowing side and reserve rails usually flip with it.',
        'In live matches, the Help button is in the top-right header if you need a rules refresher.',
      ],
      'Always check the turn banner before tapping: many mistakes are just moving during the wrong phase.',
    ),
  },
  { id: 'roll-light-4-open', kind: 'ROLL', player: 'light', value: 4, note: 'Opening roll' },
  {
    id: 'move-light-0-to-3-rosette',
    kind: 'MOVE',
    player: 'light',
    pieceId: 'light-0',
    toIndex: 3,
    note: 'Light lands on a rosette',
  },
  {
    id: 'rules-rosettes',
    kind: 'PAUSE',
    title: 'Rule: Rosettes',
    focus: 'board',
    content: lesson(
      [
        'Rosettes are special marked squares on the board.',
        'Landing on a rosette gives an extra turn in this ruleset, so Light keeps the turn now.',
      ],
      [
        'Rosettes appear in each home lane and once in the shared middle lane.',
        'The shared rosette later becomes an important safe square.',
      ],
      'Rosettes create tempo: they are often worth planning around even if another move looks more direct.',
    ),
  },
  {
    id: 'roll-light-0-no-move',
    kind: 'ROLL',
    player: 'light',
    value: 0,
    expectNoMoves: true,
    note: 'Roll 0 auto-passes',
  },
  {
    id: 'ui-dice-roll-zero',
    kind: 'UI_HINT',
    target: 'dice',
    title: 'Dice Area and Roll = 0',
    content: lesson(
      [
        'The four binary dice produce results from 0 to 4.',
        'A roll of 0 means no movement, so the turn passes automatically.',
      ],
      [
        'Watch the dice result, the turn banner, and the history/log together to confirm what happened.',
        'Sometimes a roll above 0 can still fail if every move is blocked, overshoots, or is illegal.',
      ],
      'Do not panic on low rolls or zeroes; plan for averages and use safe squares to absorb bad luck.',
    ),
  },
  { id: 'roll-dark-4-enter', kind: 'ROLL', player: 'dark', value: 4 },
  { id: 'move-dark-0-to-3', kind: 'MOVE', player: 'dark', pieceId: 'dark-0', toIndex: 3 },
  { id: 'roll-dark-3-advance', kind: 'ROLL', player: 'dark', value: 3 },
  { id: 'move-dark-0-to-6', kind: 'MOVE', player: 'dark', pieceId: 'dark-0', toIndex: 6 },
  { id: 'roll-light-2-setup-capture', kind: 'ROLL', player: 'light', value: 2 },
  {
    id: 'ui-piece-selection',
    kind: 'UI_HINT',
    target: 'pieceSelect',
    title: 'Selecting Pieces and Valid Moves',
    content: lesson(
      [
        'In live play, tap/click a piece (or the spawn cue) to preview a move, then tap the destination to confirm.',
        'Only legal destinations glow; illegal options are not highlighted.',
      ],
      [
        'The path preview helps you read exact landing squares before committing.',
        'If your roll can score (bear off), look for the green SCORE circle near the finish.',
      ],
      'Use the highlights as a checklist, then choose the move that improves safety or pressure, not just distance.',
    ),
  },
  { id: 'move-light-0-to-5', kind: 'MOVE', player: 'light', pieceId: 'light-0', toIndex: 5 },
  {
    id: 'roll-dark-0-no-move',
    kind: 'ROLL',
    player: 'dark',
    value: 0,
    expectNoMoves: true,
  },
  { id: 'roll-light-1-capture', kind: 'ROLL', player: 'light', value: 1 },
  {
    id: 'move-light-0-to-6-capture',
    kind: 'MOVE',
    player: 'light',
    pieceId: 'light-0',
    toIndex: 6,
    note: 'Capture on a non-rosette square',
  },
  {
    id: 'pause-capture-offense',
    kind: 'PAUSE',
    title: 'Offense: Captures',
    focus: 'board',
    content: lesson(
      [
        'Landing on an opponent in the shared lane captures that piece and sends it back to reserve.',
        'Captures only happen on legal landing squares; the shared rosette is protected and cannot be captured.',
      ],
      [
        'Light used a small roll to time the capture exactly.',
        'A capture costs your opponent tempo because they must re-enter from the start lane again.',
      ],
      'Threats matter as much as captures: forcing awkward responses can be stronger than racing one piece alone.',
    ),
  },
  { id: 'roll-dark-4-reenter', kind: 'ROLL', player: 'dark', value: 4 },
  { id: 'move-dark-0-to-3-reenter', kind: 'MOVE', player: 'dark', pieceId: 'dark-0', toIndex: 3 },
  { id: 'roll-dark-3-develop', kind: 'ROLL', player: 'dark', value: 3 },
  { id: 'move-dark-1-to-2', kind: 'MOVE', player: 'dark', pieceId: 'dark-1', toIndex: 2 },
  { id: 'roll-light-2-advance', kind: 'ROLL', player: 'light', value: 2 },
  { id: 'move-light-0-to-8', kind: 'MOVE', player: 'light', pieceId: 'light-0', toIndex: 8 },
  { id: 'roll-dark-1-central-lane', kind: 'ROLL', player: 'dark', value: 1 },
  { id: 'move-dark-0-to-4', kind: 'MOVE', player: 'dark', pieceId: 'dark-0', toIndex: 4 },
  { id: 'roll-light-4-rosette-setup', kind: 'ROLL', player: 'light', value: 4 },
  {
    id: 'move-light-1-to-3-rosette',
    kind: 'MOVE',
    player: 'light',
    pieceId: 'light-1',
    toIndex: 3,
    note: 'Rosette grants another turn',
  },
  {
    id: 'pause-tempo-extra-turn',
    kind: 'PAUSE',
    title: 'Tempo: Extra Turns Create Pressure',
    focus: 'turnBanner',
    content: lesson(
      [
        'Landing on a rosette lets you roll again immediately, which can chain pressure.',
        'Extra turns are often stronger than a tiny positional gain on a non-rosette square.',
      ],
      [
        'Notice the turn banner did not switch after Light landed on the rosette.',
        'Back-to-back actions make captures, escapes, and scoring threats much easier to set up.',
      ],
      'When choosing between equal-distance moves, favor the line that keeps initiative.',
    ),
  },
  { id: 'roll-light-2-lane-pressure', kind: 'ROLL', player: 'light', value: 2 },
  { id: 'move-light-1-to-5', kind: 'MOVE', player: 'light', pieceId: 'light-1', toIndex: 5 },
  { id: 'roll-dark-2-threatened', kind: 'ROLL', player: 'dark', value: 2 },
  { id: 'move-dark-0-to-6-threatened', kind: 'MOVE', player: 'dark', pieceId: 'dark-0', toIndex: 6 },
  { id: 'roll-light-4-race-piece', kind: 'ROLL', player: 'light', value: 4 },
  { id: 'move-light-0-to-12', kind: 'MOVE', player: 'light', pieceId: 'light-0', toIndex: 12 },
  { id: 'roll-dark-1-escape', kind: 'ROLL', player: 'dark', value: 1 },
  {
    id: 'move-dark-0-to-7-safe-rosette',
    kind: 'MOVE',
    player: 'dark',
    pieceId: 'dark-0',
    toIndex: 7,
    note: 'Escape to the shared rosette',
  },
  {
    id: 'roll-dark-0-extra-pass',
    kind: 'ROLL',
    player: 'dark',
    value: 0,
    expectNoMoves: true,
    note: 'Extra turn from rosette, then a zero',
  },
  { id: 'roll-light-2-blocked-option', kind: 'ROLL', player: 'light', value: 2 },
  {
    id: 'pause-defense-safe-rosette',
    kind: 'PAUSE',
    title: 'Defense: Rosette Safety and Illegal Moves',
    focus: 'board',
    content: lesson(
      [
        'Dark escaped onto the shared rosette, which is safe from capture.',
        'Light still has a roll of 2, but the tempting move onto that occupied rosette is illegal and not shown.',
      ],
      [
        'The UI teaches legality by omission: if it does not glow, the move is not allowed.',
        'This replay shows a blocked option; in other positions, a roll can produce no legal moves at all.',
      ],
      'Defensive rosette timing turns a vulnerable piece into a temporary anchor and can break an opponent attack.',
    ),
  },
  {
    id: 'move-light-0-bear-off',
    kind: 'MOVE',
    player: 'light',
    pieceId: 'light-0',
    toIndex: 14,
    note: 'Bear off for the first point',
  },
  {
    id: 'pause-close-strategy-and-site',
    kind: 'PAUSE',
    title: 'General Strategy + Site Tips',
    focus: 'controls',
    content: lesson(
      [
        'Piece development beats overcommitting: spread a few pieces so bad rolls do not strand your turn.',
        'This ruleset does not stack friendly pieces, so your own pieces can block future landing squares if you crowd lanes.',
      ],
      [
        'Risk management: push when you can capture or score, but use rosettes to avoid leaving easy targets.',
        'From Home, use Play Local vs Bot for practice, Online Multiplayer for matchmaking, and Help for the rules guide.',
      ],
      'Strong Ur play is a balance of race speed, safe squares, and timing windows for captures.',
    ),
  },
];

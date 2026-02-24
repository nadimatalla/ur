export type HowToPlaySection = {
  heading: string;
  items: string[];
};

export const HOW_TO_PLAY_TITLE = 'How to play Royal Game of Ur';

export const HOW_TO_PLAY_SECTIONS: HowToPlaySection[] = [
  {
    heading: 'Goal',
    items: ['Move all of your pieces from the start, along the track, and off the board before your opponent.'],
  },
  {
    heading: 'Taking a turn',
    items: [
      'Roll the dice to determine how many squares you can move.',
      'If you have at least one legal move, choose a piece to move exactly that number of squares.',
      'If you roll 0 or have no legal moves, your turn ends.',
    ],
  },
  {
    heading: 'Legal moves',
    items: [
      'You must move a piece forward along the track by the exact dice roll.',
      "You can’t move onto a square occupied by one of your own pieces.",
      'If a move would go past the final square, it’s not legal (unless the rules in this game allow bearing off; match existing behavior in the app).',
    ],
  },
  {
    heading: 'Captures',
    items: ['If you land on an opponent’s piece on a normal square, you capture it and send it back to the start.'],
  },
  {
    heading: 'Safe squares (rosettes)',
    items: [
      'Landing on a rosette is safe: your piece can’t be captured while on it.',
      'Landing on a rosette also grants an extra turn.',
      'You can’t capture a piece on a rosette.',
    ],
  },
  {
    heading: 'Strategy tips',
    items: [
      'Prioritize rosettes for safety and extra turns.',
      'Avoid leaving pieces vulnerable on contested squares.',
      'Bring new pieces onto the board when it’s safe, but don’t overcrowd your own path.',
    ],
  },
];

export const HOW_TO_PLAY_FINAL_NOTE =
  'These rules match the in-game behavior. If you notice a mismatch, report it so we can fix the wording.';

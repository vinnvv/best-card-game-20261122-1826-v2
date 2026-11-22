// Arrowheart Duel: constants, suits and the card catalogue.
// Suits are told apart by colour AND shape, never by text alone:
// Ember is red with a triangle, Tide is blue with a circle,
// Leaf is green with a diamond, Stone is gold with a square.
export const BOARD_CELLS = 9;
export const BOARD_SIZE = 3;
export const HAND_SIZE = 5;
export const START_LIFE = 12;
export const ROUNDS_TO_WIN = 2;

// Arrow directions, clockwise from north. A card's arrows are indices into this list.
export const DIRS = [
  { dr: -1, dc: 0, label: 'N' },
  { dr: -1, dc: 1, label: 'NE' },
  { dr: 0, dc: 1, label: 'E' },
  { dr: 1, dc: 1, label: 'SE' },
  { dr: 1, dc: 0, label: 'S' },
  { dr: 1, dc: -1, label: 'SW' },
  { dr: 0, dc: -1, label: 'W' },
  { dr: -1, dc: -1, label: 'NW' },
];

export const SUITS = {
  ember: { name: 'Ember', color: '#e5484d', dark: '#8f1d22', glyph: '▲', shape: 'triangle' },
  tide: { name: 'Tide', color: '#3e8fd9', dark: '#174a75', glyph: '●', shape: 'circle' },
  leaf: { name: 'Leaf', color: '#46a758', dark: '#1f5c2e', glyph: '◆', shape: 'diamond' },
  stone: { name: 'Stone', color: '#d9a441', dark: '#7a5514', glyph: '■', shape: 'square' },
};

// The catalogue: 18 original cards. Power 2-9, arrows decide what a card can capture.
export const CARD_DEFS = [
  { name: 'Cinder Imp', suit: 'ember', power: 3, arrows: [2, 4] },
  { name: 'Flame Knight', suit: 'ember', power: 6, arrows: [0, 2, 4] },
  { name: 'Ash Phoenix', suit: 'ember', power: 8, arrows: [0, 1, 2, 3, 4] },
  { name: 'Ember Whelp', suit: 'ember', power: 2, arrows: [2] },
  { name: 'Pyre Sage', suit: 'ember', power: 5, arrows: [0, 4] },
  { name: 'Tidecaller', suit: 'tide', power: 4, arrows: [6, 2] },
  { name: 'Coral Guard', suit: 'tide', power: 6, arrows: [0, 6, 4] },
  { name: 'Deep Leviathan', suit: 'tide', power: 9, arrows: [0, 1, 7, 6, 2] },
  { name: 'Pearl Diver', suit: 'tide', power: 3, arrows: [1, 3] },
  { name: 'Mist Herald', suit: 'tide', power: 5, arrows: [7, 0, 1] },
  { name: 'Thorn Sprout', suit: 'leaf', power: 2, arrows: [4] },
  { name: 'Vine Archer', suit: 'leaf', power: 5, arrows: [6, 5, 4] },
  { name: 'Oak Warden', suit: 'leaf', power: 7, arrows: [0, 6, 2, 4] },
  { name: 'Briar Witch', suit: 'leaf', power: 4, arrows: [1, 2, 3] },
  { name: 'Pebble Pup', suit: 'stone', power: 2, arrows: [7] },
  { name: 'Granite Golem', suit: 'stone', power: 7, arrows: [6, 5, 4, 3] },
  { name: 'Quartz Rogue', suit: 'stone', power: 5, arrows: [1, 2, 3, 4] },
  { name: 'Mountain King', suit: 'stone', power: 9, arrows: [0, 4, 6, 2] },
];

export const RIVAL_NAME = 'Rook the Rival';
export const GAME_TITLE = 'Arrowheart Duel';
export const GAME_TAGLINE = 'Every placement is a decision. Arrows capture, suits combine, the rival reads your board.';

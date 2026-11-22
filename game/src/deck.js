// Deck building and drawing. Both duelists draw from the same 18-card catalogue,
// each with their own shuffled copy, so every duel deals a fresh mix.
import { CARD_DEFS, HAND_SIZE } from './config.js';

/** Small deterministic PRNG (mulberry32) so staged screenshots replay exactly. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build one shuffled deck for `owner` ('you' or 'rival'). Cards carry unique ids. */
export function buildDeck(owner, seed) {
  const rng = makeRng(seed);
  const cards = CARD_DEFS.map((def, index) => ({
    id: owner + '-' + index,
    name: def.name,
    suit: def.suit,
    power: def.power,
    arrows: def.arrows.slice(),
  }));
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = cards[i];
    cards[i] = cards[j];
    cards[j] = tmp;
  }
  return cards;
}

/** Draw up to `count` cards from `deck` into `hand`. Returns the drawn cards. */
export function drawCards(deck, hand, count) {
  const drawn = [];
  while (drawn.length < count && deck.length > 0) {
    const card = deck.shift();
    hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

/** Refill a hand to HAND_SIZE from its deck, reshuffling discards when the deck runs short. */
export function refillHand(deck, hand, discards, seed) {
  const needed = HAND_SIZE - hand.length;
  if (deck.length < needed && discards.length > 0) {
    const rng = makeRng(seed);
    const pile = discards.splice(0, discards.length);
    for (let i = pile.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = pile[i];
      pile[i] = pile[j];
      pile[j] = tmp;
    }
    deck.push(...pile);
  }
  return drawCards(deck, hand, needed);
}

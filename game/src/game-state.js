// Duel state: one object holds the whole game, so the live duel and the staged
// screenshot scenes run through exactly the same rules.
import { BOARD_CELLS, HAND_SIZE, START_LIFE } from './config.js';
import { buildDeck, makeRng, refillHand } from './deck.js';
import { boardFull, resolvePlacement, scoreRound } from './rules.js';

/** A fresh duel. `seed` drives both decks and the rival's jitter. */
export function createDuel(seed) {
  const state = {
    seed,
    rng: makeRng(seed),
    screen: 'title',
    round: 1,
    life: { you: START_LIFE, rival: START_LIFE },
    maxLife: START_LIFE,
    roundsWon: { you: 0, rival: 0 },
    board: Array(BOARD_CELLS).fill(null),
    hands: { you: [], rival: [] },
    decks: { you: buildDeck('you', seed), rival: buildDeck('rival', seed + 101) },
    discards: { you: [], rival: [] },
    turn: 'you',
    selected: null,
    cursor: 4,
    message: 'Welcome to the Heartfield. Pick a card from your hand, then a glowing cell.',
    elapsed: 0,
    muted: false,
    showHowTo: false,
    over: false,
  };
  refillHand(state.decks.you, state.hands.you, state.discards.you, seed + 7);
  refillHand(state.decks.rival, state.hands.rival, state.discards.rival, seed + 13);
  return state;
}

/**
 * Play `hands[owner][handIndex]` onto `cell`. Returns the placement outcome:
 * { captures, bonus, roundEnded, round }. The caller renders and plays sounds.
 */
export function playCard(state, owner, handIndex, cell) {
  const hand = state.hands[owner];
  const card = hand[handIndex];
  if (!card || state.board[cell] !== null) return null;
  hand.splice(handIndex, 1);
  state.discards[owner].push(card);
  const result = resolvePlacement(state.board, cell, card, owner);
  const outcome = { captures: result.captures, bonus: result.bonus, roundEnded: false, round: null };
  if (boardFull(state.board)) {
    outcome.roundEnded = true;
    outcome.round = scoreRound(state.board);
    applyRoundEnd(state, outcome.round);
  }
  return outcome;
}

/** Apply a finished round: damage, life, rounds won, and the next round or the end. */
export function applyRoundEnd(state, round) {
  state.life.you = Math.max(0, state.life.you - round.damageToYou);
  state.life.rival = Math.max(0, state.life.rival - round.damageToRival);
  if (round.winner) state.roundsWon[round.winner] += 1;
  if (state.life.you <= 0 || state.life.rival <= 0) {
    state.over = true;
    state.screen = state.life.rival <= 0 ? 'win' : 'loss';
    return;
  }
  state.round += 1;
  state.board = Array(BOARD_CELLS).fill(null);
  state.selected = null;
  refillHand(state.decks.you, state.hands.you, state.discards.you, state.seed + state.round * 31);
  refillHand(state.decks.rival, state.hands.rival, state.discards.rival, state.seed + state.round * 47);
}

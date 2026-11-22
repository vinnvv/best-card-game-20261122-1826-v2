// Staged screenshot scenes. Each one plays the real rules forward from a fresh
// duel with a fixed seed, so every screenshot is a frame a real game produces
// and the same seed always gives the same frame.
//   cover: mid-play table, both hands, one card lifted and glowing, score on top
//   title: the title screen over a fresh table
//   win:   the victory screen after a won duel
//   loss:  the defeat screen after a lost duel
import { CARD_DEFS } from './config.js';
import { createDuel, playCard } from './game-state.js';
import { refillHand } from './deck.js';
import { chooseRivalMove } from './ai-opponent.js';

/** Return the dealt hand to the deck, then deal exactly the named cards. */
function stackHand(state, owner, names) {
  state.decks[owner].push(...state.hands[owner]);
  state.hands[owner] = [];
  for (const name of names) {
    const idx = state.decks[owner].findIndex((c) => c.name === name);
    if (idx === -1) {
      const def = CARD_DEFS.find((d) => d.name === name);
      state.hands[owner].push({
        id: owner + '-shot-' + name, name: def.name, suit: def.suit,
        power: def.power, arrows: def.arrows.slice(),
      });
    } else {
      state.hands[owner].push(state.decks[owner].splice(idx, 1)[0]);
    }
  }
}

/** Play one scripted move for `owner` by card name onto `cell`. */
function scripted(state, owner, name, cell) {
  const idx = state.hands[owner].findIndex((c) => c.name === name);
  if (idx === -1) return;
  playCard(state, owner, idx, cell);
}

/** A mid-play table: six cards down, both hands full, one card lifted. */
function stageCover(seed) {
  const state = createDuel(seed);
  state.screen = 'play';
  state.elapsed = 72;
  stackHand(state, 'you', ['Flame Knight', 'Vine Archer', 'Ash Phoenix', 'Briar Witch', 'Pyre Sage']);
  stackHand(state, 'rival', ['Quartz Rogue', 'Tidecaller', 'Coral Guard', 'Mist Herald', 'Granite Golem']);
  // Centre Knight, then a Rogue beside it; the Phoenix drops in above and
  // captures the Rogue while linking with the Knight (same Ember suit).
  scripted(state, 'you', 'Flame Knight', 4);
  scripted(state, 'rival', 'Quartz Rogue', 5);
  scripted(state, 'you', 'Ash Phoenix', 1);
  scripted(state, 'rival', 'Tidecaller', 3);
  scripted(state, 'you', 'Vine Archer', 2);
  scripted(state, 'rival', 'Coral Guard', 7);
  refillHand(state.decks.you, state.hands.you, state.discards.you, seed + 21);
  refillHand(state.decks.rival, state.hands.rival, state.discards.rival, seed + 23);
  state.selected = 1;
  state.cursor = 6;
  state.message = 'Your move: the lifted card is ready. Place it on a glowing cell; arrows capture weaker rivals.';
  return state;
}

/** Play one full duel to its end. `winner` steers who plays well. */
function playFullDuel(seed, winner) {
  const state = createDuel(seed);
  state.screen = 'play';
  let guard = 0;
  while (!state.over && guard < 200) {
    guard += 1;
    if (winner === 'you') {
      const best = bestPlayerMove(state);
      if (best) playCard(state, 'you', best.handIndex, best.cell);
      if (state.over) break;
      const weak = weakestRivalMove(state);
      if (weak) playCard(state, 'rival', weak.handIndex, weak.cell);
    } else {
      const weak = weakestPlayerMove(state);
      if (weak) playCard(state, 'you', weak.handIndex, weak.cell);
      if (state.over) break;
      const move = chooseRivalMove(state);
      if (move) playCard(state, 'rival', move.handIndex, move.cell);
    }
  }
  return state;
}

/** Play duels until the steered side wins more rounds than it loses (or give up and take the first finished duel). */
function stageEnding(seed, winner) {
  const loser = winner === 'you' ? 'rival' : 'you';
  let fallback = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const state = playFullDuel(seed + attempt * 100, winner);
    if (!state.over) continue;
    if (!fallback) fallback = state;
    if (state.roundsWon[winner] > state.roundsWon[loser]) {
      state.elapsed = 214;
      state.message = winner === 'you'
        ? 'Victory. Every arrow landed, every link held.'
        : 'Defeat. Rook read your board better this time.';
      return state;
    }
  }
  const state = fallback || playFullDuel(seed, winner);
  state.elapsed = 214;
  state.message = winner === 'you'
    ? 'Victory. Every arrow landed, every link held.'
    : 'Defeat. Rook read your board better this time.';
  return state;
}

function bestPlayerMove(state) {
  let best = null;
  let bestScore = -1;
  for (let h = 0; h < state.hands.you.length; h += 1) {
    for (let cell = 0; cell < 9; cell += 1) {
      if (state.board[cell] !== null) continue;
      const copy = state.board.map((s) => (s ? { ...s } : null));
      const card = state.hands.you[h];
      let captures = 0;
      for (const dir of card.arrows) {
        const dr = [-1, -1, 0, 1, 1, 1, 0, -1][dir];
        const dc = [0, 1, 1, 1, 0, -1, -1, -1][dir];
        const r = Math.floor(cell / 3) + dr;
        const c = (cell % 3) + dc;
        if (r < 0 || r > 2 || c < 0 || c > 2) continue;
        const slot = copy[r * 3 + c];
        if (slot && slot.owner === 'rival' && card.power > slot.power) captures += 1;
      }
      const score = captures * 4 + card.power * 0.2 + (cell === 4 ? 1 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = { handIndex: h, cell };
      }
    }
  }
  return best;
}

function weakestRivalMove(state) {
  let best = null;
  let weakest = Infinity;
  for (let h = 0; h < state.hands.rival.length; h += 1) {
    for (let cell = 0; cell < 9; cell += 1) {
      if (state.board[cell] !== null) continue;
      const power = state.hands.rival[h].power;
      if (power < weakest) {
        weakest = power;
        best = { handIndex: h, cell };
      }
    }
  }
  return best;
}

function weakestPlayerMove(state) {
  let best = null;
  let weakest = Infinity;
  for (let h = 0; h < state.hands.you.length; h += 1) {
    for (let cell = 0; cell < 9; cell += 1) {
      if (state.board[cell] !== null) continue;
      const power = state.hands.you[h].power;
      if (power < weakest) {
        weakest = power;
        best = { handIndex: h, cell };
      }
    }
  }
  return best;
}

/** Build the named scene (cover, title, win, loss; anything else is title). */
export function stageShot(name, seed) {
  if (name === 'cover') return stageCover(seed);
  if (name === 'win') return stageEnding(seed + 5, 'you');
  if (name === 'loss') return stageEnding(seed + 9, 'rival');
  const state = createDuel(seed);
  state.screen = 'title';
  state.elapsed = 0;
  return state;
}

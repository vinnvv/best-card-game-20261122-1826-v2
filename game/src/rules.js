// The duel rules: placement, arrow captures, suit synergy, round scoring.
// A card placed on the 3x3 field captures each adjacent enemy card its arrows
// point at when its power beats theirs. An arrow pointing at a friendly card of
// the same suit links them: the placed card gains +1 power for the round.
import { BOARD_SIZE, DIRS } from './config.js';

export function rowOf(cell) {
  return Math.floor(cell / BOARD_SIZE);
}

export function colOf(cell) {
  return cell % BOARD_SIZE;
}

/** The cell an arrow from `cell` in direction `dir` reaches, or -1 off the field. */
export function neighbourCell(cell, dir) {
  const r = rowOf(cell) + DIRS[dir].dr;
  const c = colOf(cell) + DIRS[dir].dc;
  if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return -1;
  return r * BOARD_SIZE + c;
}

/** Every empty cell a card may legally be played on. */
export function legalCells(board) {
  const cells = [];
  for (let i = 0; i < board.length; i += 1) {
    if (board[i] === null) cells.push(i);
  }
  return cells;
}

/** Suit synergy: +1 power for each adjacent friendly card sharing the placed suit. */
export function synergyBonus(board, cell, card, owner) {
  let bonus = 0;
  for (let dir = 0; dir < DIRS.length; dir += 1) {
    const target = neighbourCell(cell, dir);
    if (target === -1) continue;
    const placed = board[target];
    if (placed && placed.owner === owner && placed.card.suit === card.suit) bonus += 1;
  }
  return bonus;
}

/**
 * Resolve one placement. Mutates `board`, flips captured enemy cards to `owner`,
 * and returns the list of captured cells plus the synergy bonus earned.
 */
export function resolvePlacement(board, cell, card, owner) {
  const placed = { card, owner, power: card.power, linked: false };
  const captures = [];
  for (const dir of card.arrows) {
    const target = neighbourCell(cell, dir);
    if (target === -1) continue;
    const enemy = board[target];
    if (enemy && enemy.owner !== owner && placed.power > enemy.power) {
      enemy.owner = owner;
      enemy.captured = true;
      captures.push(target);
    }
  }
  const bonus = synergyBonus(board, cell, card, owner);
  if (bonus > 0) {
    placed.power += bonus;
    placed.linked = true;
  }
  board[cell] = placed;
  return { captures, bonus };
}

/** How many field cards each side holds right now. */
export function countBoard(board) {
  let you = 0;
  let rival = 0;
  for (const slot of board) {
    if (!slot) continue;
    if (slot.owner === 'you') you += 1;
    else rival += 1;
  }
  return { you, rival };
}

/** True once the field is full. */
export function boardFull(board) {
  return board.every((slot) => slot !== null);
}

/**
 * Score a finished round: the side holding more field cards deals damage equal
 * to the difference. Returns { damageToYou, damageToRival, winner }.
 */
export function scoreRound(board) {
  const count = countBoard(board);
  if (count.you === count.rival) return { damageToYou: 0, damageToRival: 0, winner: null };
  if (count.you > count.rival) {
    return { damageToYou: 0, damageToRival: count.you - count.rival, winner: 'you' };
  }
  return { damageToYou: count.rival - count.you, damageToRival: 0, winner: 'rival' };
}

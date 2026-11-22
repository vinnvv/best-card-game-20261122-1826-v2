// Rook the Rival: a readable AI opponent. It scores every legal play in the open:
// captures are worth the most, suit links next, then centre control and raw power.
// Its best move is always visible on the board, so the player can read it and counter.
import { boardFull, countBoard, legalCells, neighbourCell, resolvePlacement, synergyBonus } from './rules.js';

/** Score one candidate play on a throwaway copy of the board. Higher is better. */
function scorePlay(board, handCard, cell) {
  const copy = board.map((slot) => (slot ? { ...slot, card: slot.card } : null));
  const result = resolvePlacement(copy, cell, handCard, 'rival');
  let score = result.captures.length * 4 + result.bonus * 2 + handCard.power * 0.2;
  if (cell === 4) score += 1.5;
  if (cell === 0 || cell === 2 || cell === 6 || cell === 8) score += 0.4;
  const count = countBoard(copy);
  score += (count.rival - count.you) * 0.5;
  return score;
}

/**
 * Pick the rival's move: { handIndex, cell }. Falls back to the first legal play
 * when the hand is empty or the board is full (the caller then ends the round).
 */
export function chooseRivalMove(state) {
  const cells = legalCells(state.board);
  if (cells.length === 0 || state.hands.rival.length === 0) return null;
  let best = null;
  let bestScore = -Infinity;
  for (let h = 0; h < state.hands.rival.length; h += 1) {
    for (const cell of cells) {
      const score = scorePlay(state.board, state.hands.rival[h], cell);
      const jitter = state.rng() * 0.6;
      if (score + jitter > bestScore) {
        bestScore = score + jitter;
        best = { handIndex: h, cell };
      }
    }
  }
  return best;
}

/** The rival's board state is readable: its next best capture, for the hint line. */
export function rivalThreat(state) {
  const move = chooseRivalMove({ ...state, rng: () => 0 });
  if (!move) return null;
  const card = state.hands.rival[move.handIndex];
  let captures = 0;
  for (const dir of card.arrows) {
    const target = neighbourCell(move.cell, dir);
    if (target === -1) continue;
    const slot = state.board[target];
    if (slot && slot.owner === 'you' && card.power > slot.power) captures += 1;
  }
  return { card, cell: move.cell, captures };
}

export { boardFull };

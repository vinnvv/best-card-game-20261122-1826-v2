// Arrowheart Duel: the game loop. Wires input to the rules, runs the rival's
// turn, keeps the clock, and switches screens. With ?shot=cover|title|win|loss
// it renders one staged scene instead of starting a live duel.
import { HAND_SIZE } from './config.js';
import { createDuel, playCard } from './game-state.js';
import { chooseRivalMove, rivalThreat } from './ai-opponent.js';
import { renderTable } from './render-table.js';
import { stageShot } from './shots.js';
import {
  isMuted, playCapture, playDeal, playLink, playLoss, playPlace, playTurn, playWin, setMuted,
} from './sound.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '7');

let state = shotName ? stageShot(shotName, seed) : createDuel(seed);
let timerId = null;
let shotMode = Boolean(shotName);

function hooks() {
  return {
    onSelectCard,
    onCellClick,
    onEndTurn,
    onStart,
    onHowTo,
    onCloseHowTo,
    onRestart,
    onToggleSound,
  };
}

function render(anim) {
  renderTable(state, hooks(), anim);
}

function startClock() {
  stopClock();
  timerId = window.setInterval(() => {
    if (state.screen !== 'play' || state.showHowTo) return;
    state.elapsed += 1;
    render();
  }, 1000);
}

function stopClock() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function hintLine() {
  const threat = rivalThreat(state);
  if (!threat) return 'Your move: pick a card, then a glowing cell.';
  if (threat.captures > 0) {
    return 'Watch it: Rook can flip ' + threat.captures + ' of your cards with ' + threat.card.name +
      '. Block cell ' + (threat.cell + 1) + ' or take the centre first.';
  }
  return 'Your move: Rook is setting up ' + threat.card.name + '. Take the centre or a corner.';
}

function onSelectCard(index) {
  if (state.screen !== 'play' || state.turn !== 'you' || state.showHowTo) return;
  state.selected = state.selected === index ? null : index;
  state.message = state.selected === null
    ? hintLine()
    : state.hands.you[state.selected].name + ' is lifted. Tap a glowing cell to place it.';
  render();
}

function onCellClick(cell) {
  if (state.screen !== 'play' || state.turn !== 'you' || state.showHowTo) return;
  if (state.selected === null) {
    state.message = 'Pick a card from your hand first (click it, or press 1-5).';
    render();
    return;
  }
  if (state.board[cell] !== null) {
    state.message = 'That cell is taken. Pick a glowing empty cell.';
    render();
    return;
  }
  takeTurn(cell);
}

function takeTurn(cell) {
  const handIndex = state.selected;
  const card = state.hands.you[handIndex];
  state.selected = null;
  const outcome = playCard(state, 'you', handIndex, cell);
  if (!outcome) return;
  playPlace();
  if (outcome.captures.length > 0) playCapture();
  if (outcome.bonus > 0) playLink();
  if (outcome.roundEnded) {
    endRoundMessage(outcome);
    render({ placedCell: cell, captures: outcome.captures });
    if (state.over) {
      stopClock();
      if (state.screen === 'win') playWin();
      else playLoss();
    }
    return;
  }
  state.turn = 'rival';
  state.message = 'Rook is thinking...';
  render({ placedCell: cell, captures: outcome.captures });
  window.setTimeout(rivalTurn, 650);
}

function rivalTurn() {
  if (state.screen !== 'play' || state.turn !== 'rival') return;
  const move = chooseRivalMove(state);
  if (!move) {
    state.turn = 'you';
    state.message = hintLine();
    render();
    return;
  }
  const card = state.hands.rival[move.handIndex];
  const outcome = playCard(state, 'rival', move.handIndex, move.cell);
  if (!outcome) return;
  playPlace();
  if (outcome.captures.length > 0) playCapture();
  if (outcome.roundEnded) {
    endRoundMessage(outcome);
    render({ placedCell: move.cell, captures: outcome.captures });
    if (state.over) {
      stopClock();
      if (state.screen === 'win') playWin();
      else playLoss();
    }
    return;
  }
  state.turn = 'you';
  state.message = 'Rook played ' + card.name + '. ' + hintLine();
  render({ placedCell: move.cell, captures: outcome.captures });
}

function endRoundMessage(outcome) {
  const round = outcome.round;
  if (!round) return;
  if (round.winner === null) {
    state.message = 'Round tied, no damage. A fresh field is dealt.';
  } else if (round.winner === 'you') {
    state.message = 'Round yours: ' + round.damageToRival + ' damage to Rook. A fresh field is dealt.';
  } else {
    state.message = 'Round to Rook: ' + round.damageToYou + ' damage to you. A fresh field is dealt.';
  }
  if (state.over) {
    state.message = state.screen === 'win'
      ? 'Victory. Every arrow landed, every link held.'
      : 'Defeat. Rook read your board better this time.';
  }
}

function onEndTurn() {
  if (state.screen !== 'play' || state.turn !== 'you') return;
  playTurn();
  state.selected = null;
  state.turn = 'rival';
  state.message = 'You pass. Rook takes the field...';
  render();
  window.setTimeout(rivalTurn, 500);
}

function onStart() {
  state.screen = 'play';
  state.message = hintLine();
  playDeal();
  startClock();
  render({ dealt: true });
}

function onHowTo() {
  state.showHowTo = true;
  render();
}

function onCloseHowTo() {
  state.showHowTo = false;
  render();
}

function onRestart() {
  state = createDuel(seed + Math.floor(Math.random() * 1000));
  state.screen = 'play';
  state.message = hintLine();
  playDeal();
  startClock();
  render({ dealt: true });
}

function onToggleSound() {
  setMuted(!isMuted());
  state.muted = isMuted();
  render();
}

function onKey(event) {
  if (state.showHowTo) {
    if (event.key === 'Escape') onCloseHowTo();
    return;
  }
  if (state.screen === 'title' && (event.key === 'Enter' || event.key === ' ')) {
    onStart();
    return;
  }
  if ((state.screen === 'win' || state.screen === 'loss') && event.key === 'Enter') {
    onRestart();
    return;
  }
  if (state.screen !== 'play' || state.turn !== 'you') return;
  if (event.key >= '1' && event.key <= String(HAND_SIZE)) {
    const index = Number(event.key) - 1;
    if (index < state.hands.you.length) onSelectCard(index);
    return;
  }
  if (event.key === ' ') {
    event.preventDefault();
    onEndTurn();
    return;
  }
  if (event.key === 'h' || event.key === 'H') {
    onHowTo();
    return;
  }
  if (event.key === 'm' || event.key === 'M') {
    onToggleSound();
    return;
  }
  const moves = { ArrowUp: -3, ArrowDown: 3, ArrowLeft: -1, ArrowRight: 1 };
  if (event.key in moves) {
    event.preventDefault();
    const next = state.cursor + moves[event.key];
    if (next >= 0 && next < 9 && Math.abs((next % 3) - (state.cursor % 3)) <= 1) {
      state.cursor = next;
      render();
    }
    return;
  }
  if (event.key === 'Enter' && state.selected !== null) {
    onCellClick(state.cursor);
  }
}

window.addEventListener('keydown', onKey);

if (shotMode) {
  // Staged scene: render once, no clock, no input loop. The cover shows the
  // Phoenix capture on cell 5 with the flip animation frozen mid-flight.
  render(shotName === 'cover' ? { dealt: true, captured: [5] } : undefined);
  document.title = 'Arrowheart Duel - shot ' + shotName;
} else {
  render();
}

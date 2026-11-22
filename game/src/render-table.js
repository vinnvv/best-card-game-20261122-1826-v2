// Table rendering: the whole visible game is plain DOM, so every screenshot is
// crisp text and shapes at any size. One render pass per state change; the
// board, both hands, the life bars and the message line all come from `state`.
import { SUITS, RIVAL_NAME, GAME_TITLE, GAME_TAGLINE } from './config.js';
import { countBoard, legalCells } from './rules.js';
import { confettiBurst, dealIn, flipCaptured, popPlaced } from './animations.js';

const ARROW_POS = [
  'arrow-n', 'arrow-ne', 'arrow-e', 'arrow-se',
  'arrow-s', 'arrow-sw', 'arrow-w', 'arrow-nw',
];

/** One playing card as a DOM node. `faceDown` renders the rival's card back. */
export function cardElement(card, owner, faceDown, opts) {
  const el = document.createElement('div');
  el.className = 'card' + (faceDown ? ' card-back' : ' card-face suit-' + card.suit);
  el.dataset.cardId = card.id;
  if (faceDown) {
    el.innerHTML = '<span class="card-back-glyph">♥</span>';
    return el;
  }
  const suit = SUITS[card.suit];
  const arrows = card.arrows.map((d) => '<i class="arrow ' + ARROW_POS[d] + '"></i>').join('');
  el.innerHTML =
    '<span class="card-power">' + card.power + '</span>' +
    '<span class="card-glyph" style="color:' + suit.color + '">' + suit.glyph + '</span>' +
    '<span class="card-name">' + card.name + '</span>' +
    '<span class="card-suit">' + suit.glyph + ' ' + suit.name + '</span>' +
    arrows;
  if (opts && opts.lifted) el.classList.add('lifted');
  if (opts && opts.selected) el.classList.add('selected');
  return el;
}

function lifeBar(life, max, owner) {
  const pct = Math.max(0, Math.round((life / max) * 100));
  return '<div class="life"><span class="life-label">' + (owner === 'you' ? 'YOU' : 'RIVAL') +
    '</span><span class="life-track"><span class="life-fill ' + owner + '" style="width:' + pct + '%"></span></span>' +
    '<span class="life-num">' + life + '</span></div>';
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}

/**
 * Render the full table into #app. `hooks` carries the callbacks the table needs:
 * onSelectCard(index), onCellClick(cell), onEndTurn(), onStart(), onHowTo(), onCloseHowTo(),
 * onRestart(), onToggleSound(). `anim` describes the last action for motion.
 */
export function renderTable(state, hooks, anim) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.className = 'screen-' + state.screen;

  const header = document.createElement('header');
  header.className = 'topbar';
  header.innerHTML =
    '<div class="topbar-title">' + GAME_TITLE + '</div>' +
    '<div class="topbar-mid">' +
    '<span class="round-pill">ROUND ' + state.round + '</span>' +
    '<span class="score-pill">YOU ' + state.roundsWon.you + ' : ' + state.roundsWon.rival + ' RIVAL</span>' +
    '<span class="timer-pill">⏱ ' + formatTime(state.elapsed) + '</span>' +
    '</div>' +
    '<div class="topbar-life">' + lifeBar(state.life.you, state.maxLife, 'you') + lifeBar(state.life.rival, state.maxLife, 'rival') + '</div>';
  app.appendChild(header);

  const table = document.createElement('main');
  table.className = 'table';

  // Rival hand: face-down backs, so the table always shows both hands.
  const rivalRow = document.createElement('div');
  rivalRow.className = 'rival-row';
  const rivalLabel = document.createElement('div');
  rivalLabel.className = 'hand-label';
  rivalLabel.textContent = RIVAL_NAME + '  ·  ' + state.hands.rival.length +
    (state.hands.rival.length === 1 ? ' card' : ' cards');
  rivalRow.appendChild(rivalLabel);
  const rivalHand = document.createElement('div');
  rivalHand.className = 'hand rival-hand';
  state.hands.rival.forEach((card) => rivalHand.appendChild(cardElement(card, 'rival', true)));
  rivalRow.appendChild(rivalHand);
  table.appendChild(rivalRow);

  // The 3x3 Heartfield.
  const boardEl = document.createElement('div');
  boardEl.className = 'board';
  const legal = state.selected !== null && state.screen === 'play' ? legalCells(state.board) : [];
  state.board.forEach((slot, cell) => {
    const cellEl = document.createElement('button');
    cellEl.className = 'cell' + (legal.includes(cell) ? ' legal' : '') + (state.cursor === cell ? ' cursor' : '');
    cellEl.setAttribute('aria-label', 'Field cell ' + (cell + 1));
    if (slot) {
      const cardEl = cardElement(slot.card, slot.owner, false);
      cardEl.classList.add(slot.owner === 'you' ? 'owned-you' : 'owned-rival');
      if (slot.linked) cardEl.classList.add('linked');
      if (anim && anim.captured && anim.captured.includes(cell)) cardEl.classList.add('just-captured');
      cellEl.appendChild(cardEl);
      if (anim && anim.placedCell === cell) popPlaced(cellEl);
    } else if (legal.includes(cell)) {
      const hint = document.createElement('span');
      hint.className = 'cell-hint';
      hint.textContent = '+';
      cellEl.appendChild(hint);
    }
    cellEl.addEventListener('click', () => hooks.onCellClick(cell));
    boardEl.appendChild(cellEl);
  });
  table.appendChild(boardEl);

  // Board count line under the field.
  const count = countBoard(state.board);
  const countLine = document.createElement('div');
  countLine.className = 'board-count';
  countLine.textContent = 'Field: you hold ' + count.you + '  ·  rival holds ' + count.rival +
    '  ·  most cards at round end deals the damage';
  table.appendChild(countLine);

  // Player hand, fanned at the bottom.
  const playerRow = document.createElement('div');
  playerRow.className = 'player-row';
  const playerLabel = document.createElement('div');
  playerLabel.className = 'hand-label';
  playerLabel.textContent = 'YOUR HAND  ·  keys 1-5 pick a card, click a glowing cell to play';
  playerRow.appendChild(playerLabel);
  const handEl = document.createElement('div');
  handEl.className = 'hand player-hand';
  state.hands.you.forEach((card, i) => {
    const cardEl = cardElement(card, 'you', false, { lifted: state.selected === i, selected: state.selected === i });
    cardEl.addEventListener('click', () => hooks.onSelectCard(i));
    handEl.appendChild(cardEl);
  });
  playerRow.appendChild(handEl);
  table.appendChild(playerRow);

  // Message line + controls.
  const controls = document.createElement('div');
  controls.className = 'controls';
  const msg = document.createElement('div');
  msg.className = 'message';
  msg.textContent = state.message;
  controls.appendChild(msg);
  const buttons = document.createElement('div');
  buttons.className = 'buttons';
  const endBtn = document.createElement('button');
  endBtn.className = 'btn primary';
  endBtn.textContent = 'End turn (Space)';
  endBtn.addEventListener('click', hooks.onEndTurn);
  const howBtn = document.createElement('button');
  howBtn.className = 'btn';
  howBtn.textContent = 'How to Play';
  howBtn.addEventListener('click', hooks.onHowTo);
  const soundBtn = document.createElement('button');
  soundBtn.className = 'btn';
  soundBtn.textContent = state.muted ? 'Sound: off' : 'Sound: on';
  soundBtn.addEventListener('click', hooks.onToggleSound);
  buttons.append(endBtn, howBtn, soundBtn);
  controls.appendChild(buttons);
  table.appendChild(controls);

  app.appendChild(table);

  if (anim && anim.captured && anim.captured.length > 0) {
    const capturedEls = anim.captured.map((cell) => boardEl.children[cell].querySelector('.card'));
    flipCaptured(capturedEls);
  }
  if (state.screen === 'play' && anim && anim.dealt) dealIn(Array.from(handEl.children));

  if (state.screen === 'title') renderTitleOverlay(app, hooks);
  if (state.screen === 'win') renderEndOverlay(app, hooks, true, state);
  if (state.screen === 'loss') renderEndOverlay(app, hooks, false, state);
  if (state.showHowTo) renderHowToOverlay(app, hooks);
}

function renderTitleOverlay(app, hooks) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay title-overlay';
  overlay.innerHTML =
    '<div class="overlay-card">' +
    '<div class="overlay-kicker">A 3x3 SPATIAL CARD BATTLER</div>' +
    '<h1>' + GAME_TITLE + '</h1>' +
    '<p class="tagline">' + GAME_TAGLINE + '</p>' +
    '<p class="title-rules">Place cards on the Heartfield. Arrows capture weaker neighbours. ' +
    'Matching suits link for +1 power. Hold the most cards when the field fills to wound the rival. ' +
    'First duelist to 0 life loses.</p>' +
    '<button class="btn primary big" id="start-btn">Start duel</button>' +
    '<button class="btn big" id="title-howto">How to Play</button>' +
    '<p class="title-foot">You vs ' + RIVAL_NAME + '  ·  best of rounds  ·  first to 0 life</p>' +
    '</div>';
  app.appendChild(overlay);
  overlay.querySelector('#start-btn').addEventListener('click', hooks.onStart);
  overlay.querySelector('#title-howto').addEventListener('click', hooks.onHowTo);
}

function renderEndOverlay(app, hooks, won, state) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay end-overlay' + (won ? ' end-win' : ' end-loss');
  const count = countBoard(state.board);
  overlay.innerHTML =
    '<div class="overlay-card">' +
    '<div class="overlay-kicker">' + (won ? 'THE HEARTFIELD IS YOURS' : 'THE RIVAL HOLDS THE FIELD') + '</div>' +
    '<h1>' + (won ? 'VICTORY' : 'DEFEAT') + '</h1>' +
    '<p class="tagline">' + (won
      ? 'Every arrow landed, every link held. Rook bows out of the duel.'
      : 'Rook read your board better this time. Shuffle up and take the rematch.') + '</p>' +
    '<p class="end-score">Final life  ·  you ' + state.life.you + ' : ' + state.life.rival + ' rival' +
    '  ·  rounds ' + state.roundsWon.you + ' : ' + state.roundsWon.rival +
    '  ·  field ' + count.you + ' : ' + count.rival + '</p>' +
    '<button class="btn primary big" id="again-btn">Play again</button>' +
    '<button class="btn big" id="end-howto">How to Play</button>' +
    '</div>';
  app.appendChild(overlay);
  if (won) confettiBurst(overlay);
  overlay.querySelector('#again-btn').addEventListener('click', hooks.onRestart);
  overlay.querySelector('#end-howto').addEventListener('click', hooks.onHowTo);
}

function renderHowToOverlay(app, hooks) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay howto-overlay';
  overlay.innerHTML =
    '<div class="overlay-card howto-card">' +
    '<h2>How to Play</h2>' +
    '<ol>' +
    '<li><b>Pick a card</b> from your hand (click it, or press 1-5). It lifts and glows.</li>' +
    '<li><b>Place it</b> on a glowing field cell (click, or move with arrow keys and press Enter).</li>' +
    '<li><b>Arrows capture:</b> each arrow pointing at a weaker rival card flips it to your side.</li>' +
    '<li><b>Suits link:</b> an arrow touching a friendly card of the same suit gives +1 power.</li>' +
    '<li><b>Round end:</b> when the 3x3 field fills, the side holding more cards deals damage equal to the difference.</li>' +
    '<li><b>Win the duel:</b> bring the rival to 0 life. Lose yours and the duel is over.</li>' +
    '</ol>' +
    '<p class="howto-tip">Tip: the centre cell touches four neighbours, so it captures the most. ' +
    'Watch the hint line: it names the rival move you should block.</p>' +
    '<button class="btn primary big" id="howto-close">Got it</button>' +
    '</div>';
  app.appendChild(overlay);
  overlay.querySelector('#howto-close').addEventListener('click', hooks.onCloseHowTo);
}

// Card motion: deal-in, slide-to-cell, capture flip and win flourish.
// All motion is CSS classes + transitions; this module only schedules them,
// so a state re-render never fights an animation mid-flight.
export const ANIM_MS = 320;

/** Deal the opening hands in one by one, staggered by 70ms each. */
export function dealIn(handElements) {
  handElements.forEach((el, i) => {
    if (!el) return;
    el.classList.add('dealt');
    el.style.animationDelay = i * 70 + 'ms';
  });
}

/** Mark a board cell's card as just placed so it pops in. */
export function popPlaced(cellElement) {
  if (!cellElement) return;
  cellElement.classList.remove('placed-pop');
  void cellElement.offsetWidth;
  cellElement.classList.add('placed-pop');
}

/** Flip each captured cell's card to its new owner, staggered. */
export function flipCaptured(cellElements) {
  cellElements.forEach((el, i) => {
    if (!el) return;
    el.style.animationDelay = i * 90 + 'ms';
    el.classList.remove('captured-flip');
    void el.offsetWidth;
    el.classList.add('captured-flip');
  });
}

/** Lift the selected hand card: raised, glowing, ready to place. */
export function liftCard(handElement) {
  if (!handElement) return;
  handElement.classList.add('lifted');
}

/** Confetti burst over the win screen: 40 small shapes in suit colours. */
export function confettiBurst(container) {
  if (!container) return;
  const colours = ['#e5484d', '#3e8fd9', '#46a758', '#d9a441', '#f5d76e'];
  for (let i = 0; i < 40; i += 1) {
    const piece = document.createElement('i');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colours[i % colours.length];
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    piece.style.animationDuration = 1.6 + Math.random() * 1.4 + 's';
    container.appendChild(piece);
  }
}

// Tiny WebAudio sound effects, synthesized live: no audio files to load.
// place: soft thock, capture: bright chime, link: warm fifth, win: rising fanfare,
// loss: low descent, turn: a short tick. Muted until the player opts in.
let audioContext = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function context() {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioContext = new AC();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function tone(freq, startIn, length, type, volume) {
  if (muted) return;
  const ctx = context();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + startIn;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + length + 0.05);
}

export function playPlace() {
  tone(220, 0, 0.12, 'triangle', 0.18);
  tone(330, 0.02, 0.1, 'triangle', 0.1);
}

export function playCapture() {
  tone(523, 0, 0.14, 'sine', 0.2);
  tone(784, 0.07, 0.18, 'sine', 0.16);
}

export function playLink() {
  tone(392, 0, 0.12, 'sine', 0.14);
  tone(587, 0.05, 0.16, 'sine', 0.12);
}

export function playTurn() {
  tone(440, 0, 0.07, 'square', 0.05);
}

export function playWin() {
  [523, 659, 784, 1047].forEach((freq, i) => tone(freq, i * 0.11, 0.28, 'triangle', 0.2));
}

export function playLoss() {
  [392, 330, 262, 196].forEach((freq, i) => tone(freq, i * 0.12, 0.3, 'sine', 0.16));
}

export function playDeal() {
  tone(660, 0, 0.06, 'triangle', 0.08);
}

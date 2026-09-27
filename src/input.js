// Touch / mouse / keyboard -> scissor pose (pivot, aim, spread) + snip detection.
// Touch has two control modes (input.controls, picked in Settings, remembered in localStorage):
//   'hold' (default, easy): one finger holds the scissors; holding opens them over the weapon's openMs and lifting
//     snaps them shut (like the desktop mouse button). A second finger triggers SHRED.
//   'pinch': two fingers are the HANDLES; spread to open, pinch fast to snip, rotate to aim. A third finger = SHRED.
// Either way the pivot sits above the finger(s) and the blades extend away from them, so the cutting zone is never
// under a thumb.
// This module never touches game entities: it reports snips through the hooks passed to initInput().
import { CONFIG as C } from './config.js';
import { view, clamp, lerpK, lerpAngle } from './core.js';
import { weapon } from './scissors.js';

const CONTROLS_KEY = 'battleScissors.controls', CONTROLS = ['hold', 'pinch'];
function savedControls() {
  try { const m = localStorage.getItem(CONTROLS_KEY); if (CONTROLS.includes(m)) return m; } catch (e) { /* storage blocked */ }
  return 'hold';
}

export const input = {
  controls: savedControls(),                                               // touch control mode: 'hold' | 'pinch'
  tp: { id: [-1, -1], x: [0, 0], y: [0, 0] },                              // two tracked touches ('pinch')
  hand: { id: -1, x: 0, y: 0, dist: 0, down: false, lift: false, fresh: false }, // the one held finger ('hold')
  mouse: { x: 0, y: 0, inside: false, dist: 150, rot: 0, used: false, held: false },
  usingTouch: false,
  touchCapable: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
  fAx: 0, fAy: 0, fBx: 0, fBy: 0,                                          // current finger (handle) points
  pose: { x: 0, y: 0, theta: 0, spread: 0 },                               // smoothed, rendered pose
  rawSpread: 0, aimX: 0, aimY: -1,
  gripping: false, scAlpha: 0,
  last: { ms: -1, speed: 0, power: 1, kind: '', ver: 0 },                  // last close, for the HUD
};
let prevRaw = 0, needSnap = true, snapNext = false;
// widest raw spread since the last close through snipCloseTo (catches closes too slow for the lookback window)
let openPeak = 0;

// onSnip(px, py, theta, spread, strong), onTooSlow(), onGrip(), onSpace(), onReset(), onPause() (P / Escape),
// onSpecial() = the extra finger (second in 'hold', third in 'pinch') / E key, onPress() = a finger or the mouse button
// going down on the table (a new hand: the first finger in 'hold', either handle in 'pinch'; an armed SHRED starts on it)
const hooks = { onSnip: null, onTooSlow: null, onGrip: null, onSpace: null, onReset: null, onSpecial: null, onPause: null, onPress: null };

// ring buffer of recent samples (no per-frame allocation)
const BUF = 256;
const bT = new Float64Array(BUF), bS = new Float32Array(BUF), bX = new Float32Array(BUF), bY = new Float32Array(BUF), bA = new Float32Array(BUF);
let bHead = 0, bCount = 0;
export function resetSnipBuffer() { bCount = 0; openPeak = 0; }
function pushSample(now) {
  const pose = input.pose;
  bHead = (bHead + 1) % BUF;
  bT[bHead] = now; bS[bHead] = input.rawSpread; bX[bHead] = pose.x; bY[bHead] = pose.y; bA[bHead] = pose.theta;
  if (bCount < BUF) bCount++;
}

// Fires only on the frame the raw spread crosses down through snipCloseTo, then grades the
// AVERAGE closing speed of the whole close (human pinches decelerate at the end, so the tail alone reads slow).
function detectSnip(now) {
  const rawSpread = input.rawSpread, last = input.last;
  if (!(prevRaw > C.snipCloseTo && rawSpread <= C.snipCloseTo)) return;
  const everOpen = openPeak;
  openPeak = rawSpread;
  let peak = -1, peakIdx = -1, n = 0;
  for (let k = 1; k < bCount; k++) {
    const i = (bHead - k + BUF) % BUF;
    if (now - bT[i] > C.slowLookbackMs) break;
    const s = bS[i];
    if (s > peak) { peak = s; peakIdx = i; }                     // widest point of this close
    else if (peak - s > 0.15) break;                             // walked back past the start of this close
    n = k;
  }
  if (peak < C.snipOpenFrom) {
    // opened wide, but the close took longer than slowLookbackMs: that's a (very) slow close, not "never opened"
    if (everOpen >= C.snipOpenFrom) { last.ms = C.slowLookbackMs; last.speed = 0; last.ver++; last.kind = 'too slow'; hooks.onTooSlow(); bCount = 0; }
    return;                                                      // otherwise never opened enough: ignore
  }
  // the close began at the most recent sample still near the peak (so holding open doesn't count against you)
  let startT = bT[peakIdx], startS = peak;
  for (let k = 1; k <= n; k++) {
    const i = (bHead - k + BUF) % BUF;
    if (bS[i] >= peak - C.closeStartTol) { startT = bT[i]; startS = bS[i]; break; }
  }
  const dur = Math.max(1, now - startT);
  const speed = (startS - rawSpread) * 1000 / dur;
  last.ms = dur; last.speed = speed; last.ver++;
  if (speed >= C.snipMinSpeed) {
    last.kind = 'SNIP';
    hooks.onSnip(bX[peakIdx], bY[peakIdx], bA[peakIdx], peak, true);
  } else if (speed >= C.weakMinSpeed) {
    last.kind = 'nick';
    hooks.onSnip(bX[peakIdx], bY[peakIdx], bA[peakIdx], peak, false);
  } else {
    last.kind = 'too slow';
    hooks.onTooSlow();
  }
  bCount = 0; // re-arm: the next snip needs a fresh open
}

function beginGrip() {
  input.gripping = true; bCount = 0; openPeak = 0; hooks.onGrip();
  needSnap = snapNext || input.scAlpha < 0.3; snapNext = false;
  if (needSnap) { input.aimX = 0; input.aimY = -1; }
}
function endGrip() { input.gripping = false; bCount = 0; openPeak = 0; }

// Touch in 'hold' mode (one held finger opens the blades)?
export const holdTouch = () => input.controls === 'hold';
export function setControls(mode) {
  if (!CONTROLS.includes(mode)) return;
  input.controls = mode;
  input.tp.id[0] = input.tp.id[1] = -1; input.hand.id = -1; input.hand.down = input.hand.lift = false;
  try { localStorage.setItem(CONTROLS_KEY, mode); } catch (e) { /* storage blocked */ }
}
// Held mouse button / held finger: opens closed -> full over the current weapon's openMs.
const openStep = (dist, dt) => Math.min(C.openDistPx, dist + (C.openDistPx - C.closedDistPx) * dt * 1000 / weapon.def.openMs);

// Called first thing every frame by game.update().
export function updateInput(now, dt) {
  const frames = dt * 60, tp = input.tp, mouse = input.mouse, pose = input.pose;

  // --- raw finger points ---
  let have = false;
  if (input.usingTouch && holdTouch()) {
    // one finger = both handles side by side (aim straight up). A lift keeps the grip one more frame so detectSnip
    // sees the snap-shut; a new touch always snaps the scissors to it instead of gliding over from the last one.
    const h = input.hand;
    if (h.fresh) { h.fresh = false; if (input.gripping) endGrip(); snapNext = true; }
    if (h.down || h.lift) {
      if (h.down) h.dist = openStep(h.dist, dt);
      h.lift = false;
      input.fAx = h.x - h.dist * 0.5; input.fAy = h.y; input.fBx = h.x + h.dist * 0.5; input.fBy = h.y; have = true;
    }
  } else if (input.usingTouch) {
    if (tp.id[0] !== -1 && tp.id[1] !== -1) { input.fAx = tp.x[0]; input.fAy = tp.y[0]; input.fBx = tp.x[1]; input.fBy = tp.y[1]; have = true; }
  } else if (mouse.inside) {
    if (mouse.held) mouse.dist = openStep(mouse.dist, dt);
    const hx = Math.cos(mouse.rot) * mouse.dist * 0.5, hy = Math.sin(mouse.rot) * mouse.dist * 0.5;
    input.fAx = mouse.x - hx; input.fAy = mouse.y - hy; input.fBx = mouse.x + hx; input.fBy = mouse.y + hy; have = true;
  }
  if (have && !input.gripping) beginGrip(); else if (!have && input.gripping) endGrip();

  // --- pose ---
  if (input.gripping) {
    const dx = input.fBx - input.fAx, dy = input.fBy - input.fAy, dist = Math.hypot(dx, dy);
    input.rawSpread = clamp((dist - C.closedDistPx) / (C.openDistPx - C.closedDistPx), 0, 1);
    if (dist > 1) {                               // perpendicular to the finger line; keep the side closest to last frame's aim
      let nx = dy / dist, ny = -dx / dist;
      if (nx * input.aimX + ny * input.aimY < 0) { nx = -nx; ny = -ny; }
      input.aimX = nx; input.aimY = ny;
    }
    const aimX = input.aimX, aimY = input.aimY;
    const theta = Math.atan2(aimX, -aimY);
    const mx = (input.fAx + input.fBx) * 0.5, my = (input.fAy + input.fBy) * 0.5;
    const px = C.offsetAlongAim ? mx + aimX * C.pivotOffsetPx : mx;
    const py = C.offsetAlongAim ? my + aimY * C.pivotOffsetPx : my - C.pivotOffsetPx;
    if (needSnap) {
      pose.x = px; pose.y = py; pose.theta = theta; pose.spread = input.rawSpread; prevRaw = input.rawSpread; needSnap = false;
    } else {
      const kp = lerpK(C.poseLerp, frames), ks = lerpK(C.spreadLerp, frames);
      pose.x += (px - pose.x) * kp; pose.y += (py - pose.y) * kp;
      pose.theta = lerpAngle(pose.theta, theta, kp);
      pose.spread += (input.rawSpread - pose.spread) * ks;
    }
    input.scAlpha = Math.min(1, input.scAlpha + dt * 1000 / C.fadeInMs);
    pushSample(now);
    if (input.rawSpread > openPeak) openPeak = input.rawSpread;
    detectSnip(now);
    prevRaw = input.rawSpread;
  } else {
    input.scAlpha = Math.max(0, input.scAlpha - dt * 1000 / C.fadeOutMs);   // freeze pose, fade out
  }
}

// ======================= event wiring =======================
// Title screen: where the pointer (mouse or finger) is, for the scissors that follow it there. seen = moved at least once.
input.title = { x: 0, y: 0, down: false, seen: false };
function initTitlePointer() {
  const el = document.getElementById('title'), t = input.title;
  const at = e => { t.x = e.clientX; t.y = e.clientY; t.seen = true; };
  el.addEventListener('pointermove', at);
  el.addEventListener('pointerdown', e => { at(e); t.down = true; });
  window.addEventListener('pointerup', () => { t.down = false; });
  window.addEventListener('pointercancel', () => { t.down = false; });
}

export function initInput(h) {
  initTitlePointer();
  Object.assign(hooks, h);
  const cv = view.cv, tp = input.tp, mouse = input.mouse;
  const hintEl = document.getElementById('hint');

  // 'hold': the first finger down is the hand; any other finger landing while it's held asks for SHRED.
  function onHoldTouch(e) {
    const h = input.hand, ct = e.changedTouches;
    const lift = () => { h.id = -1; h.down = false; h.dist = C.closedDistPx; h.lift = true; };   // snap shut
    if (h.id !== -1) {                                            // lost events: the held finger is gone
      let alive = false;
      for (let i = 0; i < e.touches.length; i++) if (e.touches[i].identifier === h.id) { alive = true; break; }
      if (!alive) lift();
    }
    for (let i = 0; i < ct.length; i++) {
      const t = ct[i];
      if (e.type === 'touchstart') {
        if (h.id === -1) { h.id = t.identifier; h.x = t.clientX; h.y = t.clientY; h.dist = C.closedDistPx; h.down = true; h.lift = false; h.fresh = true; if (hooks.onPress) hooks.onPress(); }
        else if (t.identifier !== h.id && hooks.onSpecial) hooks.onSpecial();
      } else if (t.identifier === h.id) {
        if (e.type === 'touchmove') { h.x = t.clientX; h.y = t.clientY; } else lift();
      }
    }
  }

  function onTouch(e) {
    e.preventDefault();
    if (!input.usingTouch) { input.usingTouch = true; hintEl.style.display = 'none'; }
    if (holdTouch()) { onHoldTouch(e); return; }
    // drop slots whose touch is no longer on screen (lost events)
    for (let s = 0; s < 2; s++) {
      if (tp.id[s] === -1) continue;
      let alive = false;
      for (let i = 0; i < e.touches.length; i++) if (e.touches[i].identifier === tp.id[s]) { alive = true; break; }
      if (!alive) tp.id[s] = -1;
    }
    const ct = e.changedTouches;
    if (e.type === 'touchstart' || e.type === 'touchmove') {
      for (let i = 0; i < ct.length; i++) {
        const t = ct[i];
        let slot = tp.id[0] === t.identifier ? 0 : tp.id[1] === t.identifier ? 1 : -1;
        if (slot === -1 && e.type === 'touchstart') {
          slot = tp.id[0] === -1 ? 0 : tp.id[1] === -1 ? 1 : -1;
          if (slot === -1 && hooks.onSpecial) hooks.onSpecial();   // a third finger while both handles are held
        }
        if (slot === -1) continue;
        if (tp.id[slot] !== t.identifier && hooks.onPress) hooks.onPress();
        tp.id[slot] = t.identifier; tp.x[slot] = t.clientX; tp.y[slot] = t.clientY;
      }
    }
  }
  for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) cv.addEventListener(type, onTouch, { passive: false });
  document.addEventListener('gesturestart', e => e.preventDefault()); // iOS pinch-zoom
  document.addEventListener('dblclick', e => e.preventDefault());

  function mouseActive() {
    if (input.usingTouch) return false;
    if (!mouse.used) { mouse.used = true; hintEl.style.display = 'block'; }
    return true;
  }
  window.addEventListener('mousemove', e => { if (!mouseActive()) return; mouse.x = e.clientX; mouse.y = e.clientY; mouse.inside = true; });
  document.addEventListener('mouseleave', () => { mouse.inside = false; });
  cv.addEventListener('mousedown', e => {
    if (!mouseActive() || e.button !== 0) return;
    mouse.held = true;
    if (hooks.onPress) hooks.onPress();
  });
  window.addEventListener('mouseup', e => {
    if (input.usingTouch || e.button !== 0) return;
    if (!mouse.held) return;
    mouse.held = false; mouse.dist = C.closedDistPx;          // snap shut: power depends on how far it opened
  });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    if (!mouseActive()) return;
    const d = e.deltaY || e.deltaX;
    if (e.shiftKey) mouse.rot += d * C.wheelRotStep;
    else mouse.dist = clamp(mouse.dist - d * C.wheelDistStep, C.closedDistPx, C.openDistPx);
  }, { passive: false });
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) hooks.onSpace(); }
    else if (e.code === 'KeyA') mouse.rot -= C.keyRotStep;
    else if (e.code === 'KeyD') mouse.rot += C.keyRotStep;
    else if (e.code === 'KeyE') { if (!e.repeat && hooks.onSpecial) hooks.onSpecial(); }
    else if (e.code === 'KeyR') hooks.onReset();
    else if ((e.code === 'KeyP' || e.code === 'Escape') && !e.repeat && hooks.onPause) hooks.onPause();
  });

  if (!input.touchCapable) hintEl.style.display = 'block';
}

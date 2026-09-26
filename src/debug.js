// Hidden debug panel: long-press the top-right corner for 1.5s to toggle.
// Shows FPS and live sliders for the CONFIG values that most affect feel. Overrides persist in localStorage;
// the defaults are whatever config.js says (captured when this module loads, before any override is applied).
import { CONFIG as C } from './config.js';

const STORAGE_KEY = 'snipDemo.debugOverrides.v1';

// Slider metadata (UI ranges only; the values themselves live in config.js).
const KNOBS = [
  { key: 'pivotOffsetPx',      label: 'Pivot offset',        unit: 'px', min: 0,    max: 250, step: 5 },
  { key: 'closedDistPx',       label: 'Spread min (closed)', unit: 'px', min: 10,   max: 150, step: 2 },
  { key: 'openDistPx',         label: 'Spread max (open)',   unit: 'px', min: 120,  max: 400, step: 5 },
  { key: 'snipMinSpeed',       label: 'Snip speed',          unit: '/s', min: 0.4,  max: 4,   step: 0.05 },
  { key: 'spreadLerp',         label: 'Close lerp',          unit: '',   min: 0.05, max: 1,   step: 0.05 },
  { key: 'weaponScale',        label: 'Blade scale',         unit: '×',  min: 0.5,  max: 1.8, step: 0.05 },
];
const DEFAULTS = {};
for (const k of KNOBS) DEFAULTS[k.key] = C[k.key];
export const KNOB_KEYS = KNOBS.map(k => k.key);   // the six feel values, recorded in every run report

function save() {
  const o = {};
  for (const k of KNOBS) if (C[k.key] !== DEFAULTS[k.key]) o[k.key] = C[k.key];
  try { if (Object.keys(o).length) localStorage.setItem(STORAGE_KEY, JSON.stringify(o)); else localStorage.removeItem(STORAGE_KEY); } catch (e) { /* storage blocked */ }
}

// Call before the first resize() so saved values are in effect from frame one.
export function applySavedOverrides() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { /* storage blocked or corrupt */ }
  if (!saved || typeof saved !== 'object') return;
  for (const k of KNOBS) {
    const v = saved[k.key];
    if (typeof v === 'number' && isFinite(v)) C[k.key] = Math.min(k.max, Math.max(k.min, v));
  }
  if (C.openDistPx - C.closedDistPx < C.debugMinSpreadGapPx) { C.closedDistPx = DEFAULTS.closedDistPx; C.openDistPx = DEFAULTS.openDistPx; }
}

// resize: re-layout after blade scale changes; loopStats.fps: measured by the game loop; getInfo: snip-feel readout text;
// onExportRuns: download the stored run reports.
export function initDebug({ resize, loopStats, getInfo, onExportRuns }) {
  const panel = document.createElement('div');
  panel.id = 'debug';
  panel.hidden = true;
  panel.innerHTML = '<div class="dbg-head"><span>Debug</span><span class="dbg-fps">— fps</span>' +
    '<button type="button" class="dbg-close" aria-label="Close">×</button></div>';
  const fpsEl = panel.querySelector('.dbg-fps');
  const infoEl = document.createElement('pre');
  infoEl.className = 'dbg-info';
  panel.appendChild(infoEl);
  const rows = {};
  for (const k of KNOBS) {
    const row = document.createElement('label');
    row.className = 'dbg-row';
    row.innerHTML = '<span class="dbg-label"></span><span class="dbg-val"></span><input type="range">';
    row.querySelector('.dbg-label').textContent = k.label;
    const slider = row.querySelector('input');
    slider.min = k.min; slider.max = k.max; slider.step = k.step;
    slider.addEventListener('input', () => setKnob(k, parseFloat(slider.value)));
    rows[k.key] = { slider, val: row.querySelector('.dbg-val') };
    panel.appendChild(row);
  }
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button'; resetBtn.className = 'dbg-reset'; resetBtn.textContent = 'Reset defaults';
  panel.appendChild(resetBtn);
  const exportBtn = document.createElement('button');
  exportBtn.type = 'button'; exportBtn.className = 'dbg-export'; exportBtn.textContent = 'Export all runs';
  exportBtn.addEventListener('click', () => onExportRuns());
  panel.appendChild(exportBtn);
  document.body.appendChild(panel);

  // keep panel interaction from steering the desktop scissors
  for (const t of ['mousedown', 'mousemove', 'wheel']) panel.addEventListener(t, e => e.stopPropagation());

  function fmt(k, v) { return (k.step < 1 ? v.toFixed(k.step < 0.05 ? 4 : 2) : String(v)) + (k.unit ? ' ' + k.unit : ''); }
  function show(k) { const r = rows[k.key]; r.slider.value = C[k.key]; r.val.textContent = fmt(k, C[k.key]); }
  function showAll() { for (const k of KNOBS) show(k); }

  function setKnob(k, v) {
    if (k.key === 'closedDistPx') v = Math.min(v, C.openDistPx - C.debugMinSpreadGapPx);
    if (k.key === 'openDistPx') v = Math.max(v, C.closedDistPx + C.debugMinSpreadGapPx);
    C[k.key] = v;
    show(k);
    if (k.key === 'weaponScale') resize();
    save();
  }

  resetBtn.addEventListener('click', () => {
    const scaleChanged = C.weaponScale !== DEFAULTS.weaponScale;
    for (const k of KNOBS) C[k.key] = DEFAULTS[k.key];
    showAll(); save();
    if (scaleChanged) resize();
  });

  let fpsTimer = 0;
  function toggle() {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      showAll();
      fpsTimer = setInterval(() => { fpsEl.textContent = Math.round(loopStats.fps) + ' fps'; infoEl.textContent = getInfo(); }, 250);
    } else clearInterval(fpsTimer);
  }
  panel.querySelector('.dbg-close').addEventListener('click', toggle);

  // --- long-press detection (capture phase, so it sees presses on the Reset button and the canvas alike) ---
  let press = null, heldId = null, swallowUntil = 0;
  function cancel() { if (press) { clearTimeout(press.timer); press = null; } }
  window.addEventListener('pointerdown', e => {
    heldId = null; swallowUntil = 0;
    if (press || e.clientX < window.innerWidth - C.debugCornerPx || e.clientY > C.debugCornerPx) return;
    const id = e.pointerId;
    press = { id, x: e.clientX, y: e.clientY, timer: setTimeout(() => { press = null; heldId = id; toggle(); }, C.debugHoldMs) };
  }, true);
  window.addEventListener('pointermove', e => {
    if (press && e.pointerId === press.id && Math.hypot(e.clientX - press.x, e.clientY - press.y) > C.debugMoveTolPx) cancel();
  }, true);
  window.addEventListener('pointerup', e => {
    if (press && e.pointerId === press.id) cancel();
    if (e.pointerId === heldId) { heldId = null; swallowUntil = performance.now() + 400; }
  }, true);
  window.addEventListener('pointercancel', e => { if (press && e.pointerId === press.id) cancel(); if (e.pointerId === heldId) heldId = null; }, true);
  // the click that a completed long-press releases into (e.g. on the Reset button) must not also act
  window.addEventListener('click', e => {
    if (performance.now() < swallowUntil) { swallowUntil = 0; e.stopPropagation(); e.preventDefault(); }
  }, true);
}

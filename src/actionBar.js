// The bottom action bar and the Pin spots: "everything besides snipping". DOM only; reads game state, calls game actions.
// - Bar: the Thread counter chip (the Pin currency; pops on income).
// - SHRED meter (a round badge in the top-left HUD column, under the hearts): a ring that fills clockwise with snip kills. Full, it pulses; tapping it arms
//   SHRED and the next press on the table starts the spin where the scissors land (tap the meter again to cancel). E, or
//   another finger while holding the scissors, still fires it straight away.
// - Pin spots: a + button on every empty spot of the level, shown only while some Pin is affordable. Tapping one pauses
//   the game (a 'build' pause: the board stays, dimmed but for the pad) and fans this level's Pins out from the pad on
//   an arc toward the wider side of the screen: a round icon each, its name, effect and cost beside it. Tapping an
//   affordable one builds it there and resumes; the × on the pad or anywhere else closes it and resumes.
// - Tips: first-time attention for Pins (once a Pin is affordable, the + buttons and the counter pulse plus a tip,
//   until the first + tap, which pauses the game on a one-time "Pins" explainer; GOT IT resumes with that spot's
//   picker open) and SHRED ready (brief, gone on the next snip, in the first CONFIG.shredTipRuns runs until it has been used). Tip flags live in the save (Save.tips). The SHRED meter pulses whenever ready, and
//   while armed a tip over it says to press where the spin should go.
import { CONFIG as C } from './config.js';
import { view, level } from './core.js';
import { input } from './input.js';
import { state, canAfford, pinAllowed, pinIsNew, buildTower, armShred, setPaused } from './game.js';
import { Save, persist } from './save.js';
import { shredDef } from './scissors.js';

const tips = Save.tips;                          // pinIntro = the Pin explainer has been seen, shred = SHRED used once
const saveTips = persist;

const bar = document.getElementById('tray'), threadEl = document.getElementById('tray-thread'), chip = threadEl.parentElement;
const shredCard = document.getElementById('shred-card');
const tipEl = document.getElementById('tip'), tipText = document.getElementById('tip-text');
const spotsEl = document.getElementById('spots'), picker = document.getElementById('picker');
const spotBtns = [], pickCards = [];
const touchy = () => input.usingTouch || (input.touchCapable && !input.mouse.used);

// Picker icons (cream on the Pin's felt): threaded needle, snowflake, flame, horseshoe magnet.
const PIN_ICON = {
  needle: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round"><path d="M4 20 18.5 5.5" stroke="#fff4dc" stroke-width="2.6"/><path d="M20.5 3.5 18.5 5.5" stroke="#fff4dc" stroke-width="4"/><path d="M19.3 4.7l.01-.01" stroke="#3e8f5a" stroke-width="1.4"/><path d="M19.5 4.5c2 3-1 5-4 7s-6 3-9 1" stroke="#f2c230" stroke-width="1.6"/></svg>',
  ice: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff4dc" stroke-width="2.2" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5M3.6 10.4 7 9.4 6 6M18 18l-1-3.4 3.4-1M3.6 13.6 7 14.6 6 18M18 6l-1 3.4 3.4 1"/></svg>',
  fire: '<svg viewBox="0 0 24 24"><path d="M12 2c1 4 6 6.5 6 12a6 6 0 0 1-12 0c0-3 1.5-5 3-6.5 0 2 1 3.5 2.5 4C11 8.5 11 5 12 2z" fill="#ffd23f" stroke="#fff4dc" stroke-width="1.4"/><path d="M12 12c.5 2 3 3 3 5.5a3 3 0 0 1-6 0c0-1.5 1-2.5 3-5.5z" fill="#ff7a1f"/></svg>',
  magnet: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="butt"><path d="M6 3v9a6 6 0 0 0 12 0V3" stroke="#fff4dc" stroke-width="5"/><path d="M6 3v3.5M18 3v3.5" stroke="#c9d1d8" stroke-width="5"/></svg>',
};
// A darker rim for a felt colour.
function rimOf(hex) { const n = parseInt(hex.slice(1), 16); return 'rgb(' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * 0.38)).join(',') + ')'; }

let toast = () => {};
export function initActionBar(opts) {
  toast = opts.toast;
  buildSpotButtons();
  // picker cards, one per Pin type
  const row = picker.querySelector('.tcards');
  // the veil (anywhere off the Pins) and the × on the pad close the picker and resume
  for (const el of picker.querySelectorAll('.pk-veil, .pk-close')) el.addEventListener('click', e => { e.stopPropagation(); closePicker(); });
  for (const type in C.towers) {
    const def = C.towers[type], c = document.createElement('button');
    c.type = 'button'; c.className = 'pick'; c.dataset.tower = type;
    c.style.setProperty('--tc', def.color); c.style.setProperty('--pfc', def.felt); c.style.setProperty('--prim', rimOf(def.felt));
    c.innerHTML = '<span class="ticon felt">' + (PIN_ICON[type] || '') + '<span class="tnew">NEW</span></span><span class="tlabel felt"><span class="tname"></span>' +
      '<span class="tsub"></span><span class="tcost"><span class="spool"></span><span></span></span></span>';
    c.querySelector('.tname').textContent = def.name;
    c.querySelector('.tsub').textContent = def.blurb;
    c.querySelector('.tcost').lastChild.textContent = def.cost;
    c.addEventListener('click', e => { e.stopPropagation(); pickType(type); });
    row.appendChild(c); pickCards.push(c);
  }
  // the explainer: one short line per Pin (its picker blurb)
  const list = document.getElementById('pins-intro-list');
  for (const type in C.towers) {
    const def = C.towers[type], li = document.createElement('li');
    li.dataset.tower = type;
    li.innerHTML = '<span class="dot"></span><span><b></b>: </span>';
    li.querySelector('.dot').style.setProperty('--tc', def.color);
    li.querySelector('b').textContent = def.name;
    li.lastChild.appendChild(document.createTextNode(def.blurb));
    list.appendChild(li);
  }
  document.getElementById('pins-intro-ok').addEventListener('click', closePinIntro);
  // SHRED meter: listen for the touch itself too (a tap while other fingers are down rarely produces a click)
  shredCard.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); shredPressed(); }, { passive: false });
  shredCard.addEventListener('click', e => { e.stopPropagation(); shredPressed(); });
}

// ---- Pin spots + picker ----
// + buttons, one per spot of the current level (rebuilt when the level changes; measureActionBar places them)
export function buildSpotButtons() {
  closePicker();
  for (const b of spotBtns) b.remove();
  spotBtns.length = 0; shown.built = '';
  level().spots.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'felt green spot-add'; b.setAttribute('aria-label', 'Build a Pin here'); b.setAttribute('aria-expanded', 'false');
    b.innerHTML = '<span>+</span>';
    b.addEventListener('click', e => { e.stopPropagation(); spotTapped(i); });
    spotsEl.appendChild(b); spotBtns.push(b);
  });
}
const pick = { spot: -1, side: 1 };
function spotTapped(i) {
  if (!tips.pinIntro) { openPinIntro(i); return; }
  if (pick.spot === i) closePicker(); else openPicker(i);
}
// Open the picker on spot i: the game pauses (a 'build' pause keeps the board and the thread counter up) and this
// level's Pins fly out from the pad.
function openPicker(i) {
  closePicker(false);
  setPaused(true, 'build');
  if (!state.paused) return;                                   // not a live moment (the pause was refused)
  pick.spot = i; spotBtns[i].setAttribute('aria-expanded', 'true');
  for (const c of pickCards) { c.hidden = !pinAllowed(c.dataset.tower); c.classList.toggle('new', pinIsNew(c.dataset.tower)); }   // this level's Pins; NEW on its first level
  picker.hidden = false; refreshPicker(true);
  placePicker(true);
  hideTip();
}
// Close it; resume = also end its pause (false when something else already ended it, or another picker opens next).
function closePicker(resume = true) {
  if (pick.spot < 0) return;
  spotBtns[pick.spot].setAttribute('aria-expanded', 'false');
  pick.spot = -1; picker.hidden = true;
  if (resume && state.paused && state.pauseCard === 'build') setPaused(false);
}
// The fan: the Pins on an arc beside the pad, toward the wider side of the screen, evenly spaced up and down, and slid
// to stay clear of the HUD row and the bottom bar; each icon at least pickerGapPx off the pad's edge, its label beside
// it on the outside. fly = start them at the pad and let them fly out (staggered).
function placePicker(fly = false) {
  const t = state.towers[pick.spot], W = window.innerWidth, H = window.innerHeight;
  const icon = C.pickerIconPx, padR = level().spotR * view.L * view.Z;   // world px -> screen px (core.js view.Z)
  const tx = t.x * view.Z, ty = t.y * view.Z;
  const cards = pickCards.filter(c => !c.hidden), n = cards.length;
  const side = pick.side = tx < W / 2 ? 1 : -1;
  const top = 64 + icon / 2, bottom = (bar.hidden ? H : bar.getBoundingClientRect().top) - 10 - icon / 2;
  const ys = cards.map((c, k) => (k - (n - 1) / 2) * C.pickerRowPx);
  let shift = 0;
  if (n && ty + ys[0] < top) shift = top - ty - ys[0];
  if (n && ty + ys[n - 1] + shift > bottom) shift = bottom - ty - ys[n - 1];
  // A shallow curve (the middle pickerCurvePx further out than the ends), pulled in as close to the pad as it can
  // go with every icon still clear of it, so the labels keep the rest of the screen's width even when the fan is slid.
  const clear = padR + C.pickerGapPx + icon / 2, ymax = Math.max(1, Math.abs(ys[0] || 0));
  const bow = y => C.pickerCurvePx * (1 - (y / ymax) * (y / ymax));
  let x0 = 0;
  for (const y of ys) x0 = Math.max(x0, Math.sqrt(Math.max(0, clear * clear - (y + shift) * (y + shift))) - bow(y));
  const arcX = y => x0 + bow(y);
  picker.classList.toggle('left', side < 0);
  picker.style.setProperty('--cx', tx + 'px'); picker.style.setProperty('--cy', ty + 'px'); picker.style.setProperty('--hole', (padR + 8) + 'px');
  cards.forEach((c, k) => {
    const y = ys[k] + shift, x = side * arcX(ys[k]);
    const ix = tx + x, iy = ty + y;                            // the icon's centre
    c.style.top = (iy - icon / 2) + 'px';
    if (side > 0) { c.style.left = (ix - icon / 2) + 'px'; c.style.right = ''; c.style.setProperty('--room', (W - ix - icon / 2 - 18) + 'px'); }
    else { c.style.right = (W - ix - icon / 2) + 'px'; c.style.left = ''; c.style.setProperty('--room', (ix - icon / 2 - 18) + 'px'); }
    c.style.setProperty('--fx', -x + 'px'); c.style.setProperty('--fy', -y + 'px');
    c.style.setProperty('--d', k * C.pickerStaggerMs + 'ms');
  });
  picker.style.setProperty('--fly', C.pickerFlyMs + 'ms'); picker.style.setProperty('--icon', icon + 'px'); picker.style.setProperty('--btn', C.spotBtnPx + 'px');
  if (fly) { picker.classList.remove('out'); void picker.offsetWidth; requestAnimationFrame(() => picker.classList.add('out')); }
}
let pickAfford = '';
function refreshPicker(force) {
  let afford = '';
  for (const c of pickCards) afford += canAfford(c.dataset.tower) ? '1' : '0';
  if (!force && afford === pickAfford) return;
  pickAfford = afford;
  pickCards.forEach((c, i) => c.classList.toggle('poor', afford[i] !== '1'));
}
function pickType(type) {
  if (pick.spot < 0) return;
  const why = buildTower(pick.spot, type);
  if (why === 'cost') toast(C.towers[type].name + ': need ' + (C.towers[type].cost - state.thread) + ' more thread (snip kills earn it)');
  else closePicker();
}

// First + tap: pause on the explainer (once ever). GOT IT resumes with that spot's picker open.
let introSpot = -1;
function openPinIntro(i) {
  tips.pinIntro = true; saveTips();
  introSpot = i; hideTip(); setAttn(false);
  for (const li of document.querySelectorAll('#pins-intro-list li[data-tower]')) li.hidden = !pinAllowed(li.dataset.tower);   // this level's Pins only
  setPaused(true, 'pins');
}
function closePinIntro() {
  setPaused(false);
  if (introSpot >= 0 && !state.towers[introSpot].on) { spotsEl.hidden = false; openPicker(introSpot); }
  introSpot = -1;
}

function shredPressed() {
  const left = shredDef().charge - state.heli.charge;
  if (state.heli.active) return;
  if (left > 0) { toast('SHRED charges with snip kills: ' + left + ' to go'); return; }
  armShred();
}

// On resize: where "+8" pickups fly (the thread counter), where each + button sits, and the open picker/tip.
export function measureActionBar() {
  const half = C.spotBtnPx / 2;
  level().spots.forEach(([sx, sy], i) => {
    const b = spotBtns[i]; if (!b) return;
    b.style.left = ((view.LX + sx * view.L) * view.Z - half) + 'px'; b.style.top = (sy * view.L * view.Z - half) + 'px';
    b.style.width = b.style.height = C.spotBtnPx + 'px';
  });
  if (pick.spot >= 0) placePicker();
  if (bar.hidden) return;
  const r = threadEl.getBoundingClientRect();
  view.pickupX = r.left + r.width / 2; view.pickupY = r.top + r.height / 2;
  if (tip.kind) placeTip();
}

// ---- per-frame refresh (only touches the DOM when something changed) ----
const shown = { visible: false, shred: null, thread: -1, charge: -1, ready: null, armed: null, can: null, built: '' };
const tip = { kind: '', until: 0, anchor: null };
let runT0 = -1, tipPinsDone = false, tipShredDone = false, tipSnips = 0, specialsSeen = 0, attn = false;
function setAttn(on) { attn = on; bar.classList.toggle('pin-attn', on); spotsEl.classList.toggle('attn', on); }

export function refreshActionBar() {
  const visible = !bar.hidden;
  if (visible !== shown.visible) {
    shown.visible = visible; spotsEl.hidden = !visible;
    if (visible) measureActionBar(); else closePicker();
  }
  if (!visible) { hideTip(); }
  const shredShown = visible && state.shredOn;                    // no SHRED before its level (CONFIG.shredFrom)
  if (shredShown !== shown.shred) { shown.shred = shredShown; shredCard.hidden = !shredShown; }
  if (!visible) return;
  if (state.run.t0 !== runT0) {                                  // a new run: tips may show once more
    runT0 = state.run.t0; tipPinsDone = tipShredDone = false; specialsSeen = 0;
  }
  // remember for good once the player has used SHRED
  if (state.run.specials > specialsSeen) { specialsSeen = state.run.specials; if (!tips.shred) { tips.shred = true; saveTips(); } }

  if (shown.thread !== state.thread) {
    if (state.thread > shown.thread && shown.thread >= 0) { chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump'); }   // pop on income
    shown.thread = state.thread; threadEl.textContent = String(state.thread);
  }
  // + buttons: hidden once their spot has a Pin, and all of them while no Pin is affordable (CSS: #spots:not(.can))
  let built = '', can = false;
  for (const t of state.towers) built += t.on ? '1' : '0';
  for (const type in C.towers) if (pinAllowed(type) && canAfford(type)) { can = true; break; }
  if (built !== shown.built) {
    shown.built = built;
    spotBtns.forEach((b, i) => { b.hidden = built[i] === '1'; });
    if (pick.spot >= 0 && built[pick.spot] === '1') closePicker();
  }
  if (can !== shown.can) { shown.can = can; spotsEl.classList.toggle('can', can); }
  if (pick.spot >= 0 && !(state.paused && state.pauseCard === 'build')) closePicker(false);   // resumed some other way (⏸, P / Esc)
  if (pick.spot >= 0) refreshPicker(false);
  // first-time attention: enough thread for a Pin, a free spot, and the explainer not seen yet (after the wave banner)
  const nowAttn = !tips.pinIntro && can && built.includes('0') &&
    ((state.mode === 'PLAYING' && state.bannerT <= 0) || state.mode === 'WAVE_CLEAR');
  if (nowAttn !== attn) setAttn(nowAttn);
  const h = state.heli, ready = h.charge >= shredDef().charge && !h.active;
  if (shown.charge !== h.charge || shown.ready !== ready || shown.armed !== h.armed) {
    shown.charge = h.charge; shown.ready = ready; shown.armed = h.armed;
    shredCard.style.setProperty('--p', Math.round(h.charge / shredDef().charge * 100));
    shredCard.classList.toggle('ready', ready && !h.armed);
    shredCard.classList.toggle('armed', h.armed);
    shredCard.setAttribute('aria-label', h.armed ? 'SHRED armed: tap to cancel' : ready ? 'SHRED ready: tap to arm' : 'SHRED ' + h.charge + ' of ' + shredDef().charge + ' kills');
  }
  updateTip(ready, built);
}
chip.addEventListener('animationend', () => chip.classList.remove('bump'));

function updateTip(ready, built) {
  const now = performance.now();
  if (state.heli.armed) {
    showTip('armed', shredCard, (touchy() ? 'Touch' : 'Click') + ' where you want to SHRED.', 0);
  } else if (ready && !tips.shred && !tipShredDone && (tips.shredRuns || 0) < C.shredTipRuns) {
    tipShredDone = true; tips.shredRuns = (tips.shredRuns || 0) + 1; saveTips();
    showTip('shred', shredCard, 'SHRED ready! Tap the meter to use it.', now + C.shredTipMs);
    tipSnips = state.stats.snips;
  } else if (attn && !tipPinsDone && pick.spot < 0) {
    tipPinsDone = true;
    showTip('pins', spotBtns[built.indexOf('0')], 'You have enough Thread for a Pin! ' + (touchy() ? 'Tap' : 'Click') + ' a + beside the road.', now + C.tipShowMs);
  }
  if (tip.kind && tip.until && now > tip.until) hideTip();
  if (tip.kind === 'shred' && (!ready || state.heli.active || state.heli.armed || state.stats.snips !== tipSnips)) hideTip();   // playing on dismisses it
  if (tip.kind === 'armed' && !state.heli.armed) hideTip();
  if (tip.kind === 'pins' && !attn) hideTip();
}
function showTip(kind, anchor, text, until) {
  if (tip.kind === kind && tipText.textContent === text) return;
  tip.kind = kind; tip.until = until; tip.anchor = anchor;
  tipText.textContent = text; tipEl.hidden = false;
  tipEl.classList.toggle('passthru', kind !== 'pins');   // the SHRED tips sit over the board: touches go through to the table
  placeTip();
}
// Centred over its anchor, kept on screen, the arrow pointing at the anchor. Anchors in the bar get the tip above
// the whole bar; a + button gets it just above itself; an anchor in the top half (the SHRED meter) gets it below.
function placeTip() {
  const r = tip.anchor.getBoundingClientRect(), w = tipEl.offsetWidth, cx = r.left + r.width / 2;
  const left = Math.max(8, Math.min(window.innerWidth - w - 8, cx - w / 2));
  const below = r.top + r.height / 2 < window.innerHeight / 2;
  tipEl.classList.toggle('below', below);
  tipEl.style.left = left + 'px';
  if (below) { tipEl.style.top = (r.bottom + 12) + 'px'; tipEl.style.bottom = ''; }
  else {
    const above = bar.contains(tip.anchor) ? bar.getBoundingClientRect().top : r.top;
    tipEl.style.top = ''; tipEl.style.bottom = (window.innerHeight - above + 10) + 'px';
  }
  tipEl.style.setProperty('--arrow', (cx - left) + 'px');
}
function hideTip() { if (tip.kind) { tip.kind = ''; tipEl.hidden = true; } }
tipEl.addEventListener('click', hideTip);

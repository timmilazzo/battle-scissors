// The bottom action bar and the Pin spots: "everything besides snipping". DOM only; reads game state, calls game actions.
// - Bar: the Thread counter chip (the Pin currency; pops on income) and the SHRED card (charge meter; tap it, or anywhere,
//   with another finger while holding the scissors: the 2nd finger in 'hold' controls, the 3rd in 'pinch'; or press E).
// - Pin spots: a + button on every empty spot of the level. Tapping one opens a picker beside it with one card per
//   Pin (name, effect, cost); tapping an affordable card builds that Pin there. Tapping elsewhere closes it.
// - Tips: first-time attention for Pins (once a Pin is affordable, the + buttons and the counter pulse plus a tip,
//   until the first + tap, which pauses the game on a one-time "Pins" explainer; GOT IT resumes with that spot's
//   picker open) and the first time SHRED is ready (until it has ever been used). The SHRED card pulses whenever ready.
import { CONFIG as C } from './config.js';
import { view } from './core.js';
import { input, holdTouch } from './input.js';
import { state, canAfford, buildTower, trySpecial, setPaused } from './game.js';

const TIPS_KEY = 'battleScissors.tips';
let tips = { pinIntro: false, shred: false };   // pinIntro = the Pin explainer has been seen
try { tips = Object.assign(tips, JSON.parse(localStorage.getItem(TIPS_KEY) || '{}')); } catch (e) { /* storage blocked */ }
const saveTips = () => { try { localStorage.setItem(TIPS_KEY, JSON.stringify(tips)); } catch (e) { /* storage blocked */ } };

const bar = document.getElementById('tray'), threadEl = document.getElementById('tray-thread'), chip = threadEl.parentElement;
const shredCard = document.getElementById('shred-card'), shredFill = shredCard.querySelector('.tmeter > span'), shredSub = shredCard.querySelector('.tsub');
const tipEl = document.getElementById('tip'), tipText = document.getElementById('tip-text');
const spotsEl = document.getElementById('spots'), picker = document.getElementById('picker');
const spotBtns = [], pickCards = [];
const touchy = () => input.usingTouch || (input.touchCapable && !input.mouse.used);
const extraFinger = () => holdTouch() ? 'second' : 'third';

// What each Pin does, for the explainer (numbers come from config so the copy stays true).
const PIN_TEXT = {
  ice: d => 'enemies in its ring move slower, and a slowed Brute’s armor won’t stop your snip.',
  fire: d => 'sets enemies in its ring on fire: they burn ' + d.burnDps + ' HP a second, armor or not, and keep burning ' + d.burnSec + 's after they leave it.',
  magnet: d => 'every ' + d.periodSec + 's it pulls nearby enemies into a clump on the road. Snip the clump for a multi-snip.',
};

// Picker icons (cream on the Pin's felt): snowflake, flame, horseshoe magnet.
const PIN_ICON = {
  ice: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff4dc" stroke-width="2.2" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5M3.6 10.4 7 9.4 6 6M18 18l-1-3.4 3.4-1M3.6 13.6 7 14.6 6 18M18 6l-1 3.4 3.4 1"/></svg>',
  fire: '<svg viewBox="0 0 24 24"><path d="M12 2c1 4 6 6.5 6 12a6 6 0 0 1-12 0c0-3 1.5-5 3-6.5 0 2 1 3.5 2.5 4C11 8.5 11 5 12 2z" fill="#ffd23f" stroke="#fff4dc" stroke-width="1.4"/><path d="M12 12c.5 2 3 3 3 5.5a3 3 0 0 1-6 0c0-1.5 1-2.5 3-5.5z" fill="#ff7a1f"/></svg>',
  magnet: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="butt"><path d="M6 3v9a6 6 0 0 0 12 0V3" stroke="#fff4dc" stroke-width="5"/><path d="M6 3v3.5M18 3v3.5" stroke="#c9d1d8" stroke-width="5"/></svg>',
};
// A darker rim for a felt colour.
function rimOf(hex) { const n = parseInt(hex.slice(1), 16); return 'rgb(' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * 0.38)).join(',') + ')'; }

let toast = () => {};
export function initActionBar(opts) {
  toast = opts.toast;
  // + buttons, one per level spot
  C.level.spots.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'felt green spot-add'; b.setAttribute('aria-label', 'Build a Pin here'); b.setAttribute('aria-expanded', 'false');
    b.innerHTML = '<span>+</span>';
    b.addEventListener('click', e => { e.stopPropagation(); spotTapped(i); });
    spotsEl.appendChild(b); spotBtns.push(b);
  });
  // picker cards, one per Pin type
  const row = picker.querySelector('.tcards');
  for (const type in C.towers) {
    const def = C.towers[type], c = document.createElement('button');
    c.type = 'button'; c.className = 'felt pick'; c.dataset.tower = type;
    c.style.setProperty('--tc', def.color); c.style.setProperty('--fc', def.felt); c.style.setProperty('--rim', rimOf(def.felt));
    c.innerHTML = '<span class="ticon">' + (PIN_ICON[type] || '') + '</span><span class="tname"></span><span class="tsub"></span><span class="tcost"><span class="spool"></span><span></span></span>';
    c.querySelector('.tname').textContent = def.name;
    c.querySelector('.tsub').textContent = def.blurb;
    c.querySelector('.tcost').lastChild.textContent = def.cost;
    c.addEventListener('click', e => { e.stopPropagation(); pickType(type); });
    row.appendChild(c); pickCards.push(c);
  }
  // anything outside the picker (and its + button) closes it
  document.addEventListener('pointerdown', e => {
    if (pick.spot >= 0 && !picker.contains(e.target) && e.target !== spotBtns[pick.spot] && !spotBtns[pick.spot].contains(e.target)) closePicker();
  }, true);
  // the explainer
  const list = document.getElementById('pins-intro-list');
  for (const type in C.towers) {
    const def = C.towers[type], li = document.createElement('li');
    li.innerHTML = '<span class="dot"></span><span><b></b> (' + def.cost + ' thread): </span>';
    li.querySelector('.dot').style.setProperty('--tc', def.color);
    li.querySelector('b').textContent = def.name;
    li.lastChild.appendChild(document.createTextNode(PIN_TEXT[type] ? PIN_TEXT[type](def) : def.blurb));
    list.appendChild(li);
  }
  const li = document.createElement('li');
  li.innerHTML = '<span class="dot" style="--tc:#d9a55a"></span><span><b>Thread</b> pays for Pins: +' + C.threadPerKill + ' per kill, +' +
    C.threadPerLeak + ' when an enemy reaches the workshop.</span>';
  list.appendChild(li);
  document.getElementById('pins-intro-ok').addEventListener('click', closePinIntro);
  // SHRED: a third finger on the card works too (multi-touch rarely produces a click, so listen for the touch itself)
  shredCard.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); shredPressed(); }, { passive: false });
  shredCard.addEventListener('click', e => { e.stopPropagation(); shredPressed(); });
}

// ---- Pin spots + picker ----
const pick = { spot: -1 };
function spotTapped(i) {
  if (!tips.pinIntro) { openPinIntro(i); return; }
  if (pick.spot === i) closePicker(); else openPicker(i);
}
function openPicker(i) {
  closePicker();
  pick.spot = i; spotBtns[i].setAttribute('aria-expanded', 'true');
  picker.hidden = false; refreshPicker(true);
  placePicker();
  hideTip();
}
function closePicker() {
  if (pick.spot < 0) return;
  spotBtns[pick.spot].setAttribute('aria-expanded', 'false');
  pick.spot = -1; picker.hidden = true;
}
// Beside its spot: above it when there's room, else below; kept on screen, the arrow pointing at the spot.
function placePicker() {
  const t = state.towers[pick.spot], w = picker.offsetWidth, h = picker.offsetHeight, gap = C.spotBtnPx / 2 + 12;
  const left = Math.max(8, Math.min(window.innerWidth - w - 8, t.x - w / 2));
  const above = t.y - gap - h > 56;
  picker.style.left = left + 'px';
  picker.style.top = (above ? t.y - gap - h : t.y + gap) + 'px';
  picker.classList.toggle('below', !above);
  picker.style.setProperty('--arrow', (t.x - left) + 'px');
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
  setPaused(true, 'pins');
}
function closePinIntro() {
  setPaused(false);
  if (introSpot >= 0 && !state.towers[introSpot].on) { spotsEl.hidden = false; openPicker(introSpot); }
  introSpot = -1;
}

function shredPressed() {
  const left = C.heliKillsToCharge - state.heli.charge;
  if (left > 0) { toast('SHRED charges with snip kills: ' + left + ' to go'); return; }
  if (!touchy()) { toast('Press E while aiming at a crowd'); return; }
  if (!input.gripping) { toast(holdTouch() ? 'Hold the scissors with one finger, then tap with a second' : 'Hold the scissors with two fingers, then tap SHRED with a third'); return; }
  trySpecial();
}

// On resize: where "+8" pickups fly (the thread counter), where each + button sits, and the open picker/tip.
export function measureActionBar() {
  const half = C.spotBtnPx / 2;
  C.level.spots.forEach(([sx, sy], i) => {
    const b = spotBtns[i]; if (!b) return;
    b.style.left = (view.LX + sx * view.L - half) + 'px'; b.style.top = (sy * view.L - half) + 'px';
    b.style.width = b.style.height = C.spotBtnPx + 'px';
  });
  if (pick.spot >= 0) placePicker();
  if (bar.hidden) return;
  const r = threadEl.getBoundingClientRect();
  view.pickupX = r.left + r.width / 2; view.pickupY = r.top + r.height / 2;
  if (tip.kind) placeTip();
}

// ---- per-frame refresh (only touches the DOM when something changed) ----
const shown = { visible: false, thread: -1, charge: -1, ready: null, can: null, built: '' };
const tip = { kind: '', until: 0, anchor: null };
let runT0 = -1, tipPinsDone = false, tipShredDone = false, specialsSeen = 0, attn = false;
function setAttn(on) { attn = on; bar.classList.toggle('pin-attn', on); spotsEl.classList.toggle('attn', on); }

export function refreshActionBar() {
  const visible = !bar.hidden;
  if (visible !== shown.visible) {
    shown.visible = visible; spotsEl.hidden = !visible;
    if (visible) measureActionBar(); else closePicker();
  }
  if (!visible) { hideTip(); return; }
  if (state.run.t0 !== runT0) {                                  // a new run: tips may show once more
    runT0 = state.run.t0; tipPinsDone = tipShredDone = false; specialsSeen = 0;
  }
  // remember for good once the player has used SHRED
  if (state.run.specials > specialsSeen) { specialsSeen = state.run.specials; if (!tips.shred) { tips.shred = true; saveTips(); } }

  if (shown.thread !== state.thread) {
    if (state.thread > shown.thread && shown.thread >= 0) { chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump'); }   // pop on income
    shown.thread = state.thread; threadEl.textContent = String(state.thread);
  }
  // + buttons: hidden once their spot has a Pin; bright when some Pin is affordable
  let built = '', can = false;
  for (const t of state.towers) built += t.on ? '1' : '0';
  for (const type in C.towers) if (canAfford(type)) { can = true; break; }
  if (built !== shown.built) {
    shown.built = built;
    spotBtns.forEach((b, i) => { b.hidden = built[i] === '1'; });
    if (pick.spot >= 0 && built[pick.spot] === '1') closePicker();
  }
  if (can !== shown.can) { shown.can = can; spotsEl.classList.toggle('can', can); }
  if (pick.spot >= 0) refreshPicker(false);
  // first-time attention: enough thread for a Pin, a free spot, and the explainer not seen yet (after the wave banner)
  const nowAttn = !tips.pinIntro && can && built.includes('0') &&
    ((state.mode === 'PLAYING' && state.bannerT <= 0) || state.mode === 'WAVE_CLEAR');
  if (nowAttn !== attn) setAttn(nowAttn);
  const h = state.heli, ready = h.charge >= C.heliKillsToCharge && !h.active;
  if (shown.charge !== h.charge || shown.ready !== ready) {
    shown.charge = h.charge; shown.ready = ready;
    shredFill.style.width = Math.round(h.charge / C.heliKillsToCharge * 100) + '%';
    shredCard.classList.toggle('ready', ready);
    shredSub.textContent = ready ? (touchy() ? (holdTouch() ? 'READY: 2nd finger' : 'READY: 3rd finger') : 'READY: press E') : h.charge + ' / ' + C.heliKillsToCharge + ' kills';
  }
  updateTip(ready, built);
}
chip.addEventListener('animationend', () => chip.classList.remove('bump'));

function updateTip(ready, built) {
  const now = performance.now();
  if (ready && !tips.shred && !tipShredDone) {
    tipShredDone = true;
    showTip('shred', shredCard, 'SHRED is ready! ' + (touchy() ? 'While holding the scissors, tap a ' + extraFinger() + ' finger' : 'Press E') +
      ' to spin through everything in reach.', now + C.tipShowMs);
  } else if (attn && !tipPinsDone && pick.spot < 0) {
    tipPinsDone = true;
    showTip('pins', spotBtns[built.indexOf('0')], 'You have enough Thread for a Pin! ' + (touchy() ? 'Tap' : 'Click') + ' a + beside the road.', now + C.tipShowMs);
  }
  if (tip.kind && tip.until && now > tip.until) hideTip();
  if (tip.kind === 'shred' && (!ready || state.heli.active)) hideTip();
  if (tip.kind === 'pins' && !attn) hideTip();
}
function showTip(kind, anchor, text, until) {
  if (tip.kind === kind && tipText.textContent === text) return;
  tip.kind = kind; tip.until = until; tip.anchor = anchor;
  tipText.textContent = text; tipEl.hidden = false;
  placeTip();
}
// Centred over its anchor, kept on screen, the arrow pointing at the anchor. Anchors in the bar get the tip above
// the whole bar; a + button gets it just above itself.
function placeTip() {
  const r = tip.anchor.getBoundingClientRect(), w = tipEl.offsetWidth, cx = r.left + r.width / 2;
  const left = Math.max(8, Math.min(window.innerWidth - w - 8, cx - w / 2));
  const above = bar.contains(tip.anchor) ? bar.getBoundingClientRect().top : r.top;
  tipEl.style.left = left + 'px';
  tipEl.style.bottom = (window.innerHeight - above + 10) + 'px';
  tipEl.style.setProperty('--arrow', (cx - left) + 'px');
}
function hideTip() { if (tip.kind) { tip.kind = ''; tipEl.hidden = true; } }
tipEl.addEventListener('click', hideTip);

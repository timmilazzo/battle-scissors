// The bottom action bar and the Pin spots: "everything besides snipping". DOM only; reads game state, calls game actions.
// - Bar: the Thread counter chip (the Pin currency; pops on income).
// - Move meters: one round badge per move slot (#move-card-0, #move-card-1, in the top-left HUD column under the wave
//   badge; game.js "moves"), shown while its slot holds a move, in that move's icon and felt (SHRED: CONFIG.shredBadge; a
//   Skill: CONFIG.skills). Its ring fills with the slot's charge (state.moves[i].charge: SHRED's snip kills, a Skill's own
//   events) and pulses gold when full; a tap uses it (game.js useMove; desktop: E slot 1, F slot 2): SHRED arms and the
//   next press on the table starts the spin where the scissors land (another finger while holding the scissors, or the
//   key while gripping, spins at once); Focus and Thimble go off at once (the ring then shows the time / stops left, .on);
//   Mark / Pinking / Basting arm (a tip says what to do next). Tap an armed badge again to cancel; arming one disarms the
//   other. Basting has no meter: its badge shows the Thread price and dims while the balance is short.
// - Pin spots: a + button on every empty spot of the level, shown only while some Pin is affordable. Tapping one pauses
//   the game (a 'build' pause: the board stays, dimmed but for the pad) and fans this level's Pins out from the pad on
//   an arc toward the wider side of the screen: a round icon each, its name, effect and cost beside it. Tapping an
//   affordable one builds it there and resumes; the × on the pad or anywhere else closes it and resumes.
// - Tips: attention for each new Pin type (once a Pin this level offers for the first time is affordable, the + buttons
//   and the counter pulse plus a tip, until a + tap, which pauses the game on an explainer for just that Pin (the very
//   first one also shows how building works); GOT IT resumes with that spot's picker open) and SHRED ready (brief, gone on the next snip, in the first CONFIG.shredTipRuns runs until it has been used). Tip flags live in the save (Save.tips). A move meter pulses whenever ready, and
//   while armed a tip under it says what it waits for (where to press for the spin, which enemy to mark...); once per
//   Skill ever, a tip says it's ready (Save.tips.skills).
import { CONFIG as C } from './config.js';
import { view, level } from './core.js';
import { input } from './input.js';
import { state, canAfford, pinAllowed, pinIsNew, buildTower, rankUp, useMove, moveReady, setPaused } from './game.js';
import { Save, persist } from './save.js';
import { pinCost, rankUpCost, rankUpText } from './pins.js';

const tips = Save.tips;                          // pins = Pin types the explainer has introduced, shred = SHRED used once
const saveTips = persist;

const bar = document.getElementById('tray'), threadEl = document.getElementById('tray-thread'), chip = threadEl.parentElement;
// one badge per move slot (state.moves[i]), with its icon and price tag
const moveCards = [0, 1].map(i => document.getElementById('move-card-' + i));
const moveIcos = moveCards.map(c => c.querySelector('.ticon')), moveCosts = moveCards.map(c => c.querySelector('.mcost'));
const tipEl = document.getElementById('tip'), tipText = document.getElementById('tip-text');
const spotsEl = document.getElementById('spots'), picker = document.getElementById('picker');
const spotBtns = [], upBtns = [], pickCards = [];           // + per spot, the rank-up button per spot, a picker card per Pin type
let rankCard = null;                                        // the picker's one card in rank mode (a built Pin's next rank)
const touchy = () => input.usingTouch || (input.touchCapable && !input.mouse.used);

// Picker icons (cream on the Pin's felt): threaded needle, snowflake, flame, horseshoe magnet, wine cork, light bulb,
// birthday candle (the Sewing Box's Pins tab and the map's Pin-tier card reuse them).
export const PIN_ICON = {
  needle: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round"><path d="M4 20 18.5 5.5" stroke="#fff4dc" stroke-width="2.6"/><path d="M20.5 3.5 18.5 5.5" stroke="#fff4dc" stroke-width="4"/><path d="M19.3 4.7l.01-.01" stroke="#3e8f5a" stroke-width="1.4"/><path d="M19.5 4.5c2 3-1 5-4 7s-6 3-9 1" stroke="#f2c230" stroke-width="1.6"/></svg>',
  ice: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff4dc" stroke-width="2.2" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5M3.6 10.4 7 9.4 6 6M18 18l-1-3.4 3.4-1M3.6 13.6 7 14.6 6 18M18 6l-1 3.4 3.4 1"/></svg>',
  fire: '<svg viewBox="0 0 24 24"><path d="M12 2c1 4 6 6.5 6 12a6 6 0 0 1-12 0c0-3 1.5-5 3-6.5 0 2 1 3.5 2.5 4C11 8.5 11 5 12 2z" fill="#ffd23f" stroke="#fff4dc" stroke-width="1.4"/><path d="M12 12c.5 2 3 3 3 5.5a3 3 0 0 1-6 0c0-1.5 1-2.5 3-5.5z" fill="#ff7a1f"/></svg>',
  magnet: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="butt"><path d="M6 3v9a6 6 0 0 0 12 0V3" stroke="#fff4dc" stroke-width="5"/><path d="M6 3v3.5M18 3v3.5" stroke="#c9d1d8" stroke-width="5"/></svg>',
  cork: '<svg viewBox="0 0 24 24"><path d="M7 5h10l-1.5 15h-7z" fill="#e2b77c" stroke="#fff4dc" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="12" cy="5" rx="5" ry="1.8" fill="#f2d3a0" stroke="#fff4dc" stroke-width="1.4"/><circle cx="10" cy="11" r="1" fill="#6b3f1e"/><circle cx="13.6" cy="14" r=".9" fill="#6b3f1e"/><circle cx="11" cy="17" r=".8" fill="#6b3f1e"/></svg>',
  lamp: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round"><path d="M9 16c0-2-3-4-3-8a6 6 0 0 1 12 0c0 4-3 6-3 8z" fill="#fff1a8" stroke="#fff4dc" stroke-width="1.6"/><path d="M9.5 18.5h5M10 21h4" stroke="#fff4dc" stroke-width="2"/><path d="M10.5 15v-4l1.5 1.5 1.5-1.5v4" stroke="#e8902a" stroke-width="1.3"/></svg>',
  candle: '<svg viewBox="0 0 24 24"><rect x="9" y="10" width="6" height="12" rx="1" fill="#fffaf0" stroke="#8a6a3a" stroke-width="1.3"/><path d="M9.6 13.5l4.8-1.8M9.6 17.5l4.8-1.8M9.6 21l4.8-1.8" stroke="#e0312b" stroke-width="1.6"/><path d="M12 2c1.5 2 2.5 3.5 2.5 5a2.5 2.5 0 0 1-5 0C9.5 5.5 10.5 4 12 2z" fill="#ffd23f" stroke="#e0602b" stroke-width="1"/></svg>',
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
    c.querySelector('.tcost').lastChild.textContent = pinCost(type);   // refreshed as the picker opens (the type's tier may cut it)
    c.addEventListener('click', e => { e.stopPropagation(); pickType(type); });
    row.appendChild(c); pickCards.push(c);
  }
  // the rank card: in rank mode the picker shows just this, filled from the tapped Pin (openPicker)
  rankCard = document.createElement('button');
  rankCard.type = 'button'; rankCard.className = 'pick rankcard'; rankCard.hidden = true;
  rankCard.innerHTML = '<span class="ticon felt"><span class="trank"></span></span><span class="tlabel felt"><span class="tname"></span>' +
    '<span class="tsub"></span><span class="tcost"><span class="spool"></span><span></span></span></span>';
  rankCard.addEventListener('click', e => { e.stopPropagation(); pickRank(); });
  row.appendChild(rankCard);
  // the explainer: a line per Pin (its intro), shown only for the ones it is introducing
  const list = document.getElementById('pins-intro-list');
  for (const type in C.towers) {
    const def = C.towers[type], li = document.createElement('li');
    li.dataset.tower = type;
    li.innerHTML = '<span class="dot"></span><span><b></b>: </span>';
    li.querySelector('.dot').style.setProperty('--tc', def.color);
    li.querySelector('b').textContent = def.name;
    li.lastChild.appendChild(document.createTextNode(def.intro || def.blurb));
    list.appendChild(li);
  }
  document.getElementById('pins-intro-ok').addEventListener('click', closePinIntro);
  // the move meters: listen for the touch itself too (a tap while other fingers are down rarely produces a click)
  moveCards.forEach((c, i) => {
    c.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); movePressed(i); }, { passive: false });
    c.addEventListener('click', e => { e.stopPropagation(); movePressed(i); });
  });
}

// ---- Pin spots + picker ----
// + buttons, one per spot of the current level (rebuilt when the level changes; measureActionBar places them)
export function buildSpotButtons() {
  closePicker();
  for (const b of spotBtns) b.remove();
  for (const b of upBtns) b.remove();
  spotBtns.length = 0; upBtns.length = 0; shown.built = ''; shown.ranks = '';
  level().spots.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'felt green spot-add'; b.setAttribute('aria-label', 'Build a Pin here'); b.setAttribute('aria-expanded', 'false');
    b.innerHTML = '<span>+</span>';
    b.addEventListener('click', e => { e.stopPropagation(); spotTapped(i); });
    spotsEl.appendChild(b); spotBtns.push(b);
    // the rank-up button: sits at the top right of a built Pin, shows the next rank's name (II, III) and its Thread cost
    const u = document.createElement('button');
    u.type = 'button'; u.className = 'felt spot-up'; u.hidden = true; u.setAttribute('aria-label', 'Rank this Pin up'); u.setAttribute('aria-expanded', 'false');
    u.innerHTML = '<span></span>';
    u.addEventListener('click', e => { e.stopPropagation(); if (pick.spot === i && pick.mode === 'rank') closePicker(); else openPicker(i, 'rank'); });
    spotsEl.appendChild(u); upBtns.push(u);
  });
}
const pick = { spot: -1, side: 1, mode: 'build' };          // mode: 'build' (the Pins fan out) or 'rank' (the one rank card)
// A Pin this level offers that the explainer hasn't introduced yet.
const pinUnseen = type => pinAllowed(type) && !tips.pins.includes(type);
function spotTapped(i) {
  if (Object.keys(C.towers).some(pinUnseen)) { openPinIntro(i); return; }
  if (pick.spot === i && pick.mode === 'build') closePicker(); else openPicker(i);
}
// Open the picker on spot i: the game pauses (a 'build' pause keeps the board and the thread counter up) and this
// level's Pins fly out from the pad; in rank mode, one card with the Pin's next rank instead.
function openPicker(i, mode = 'build') {
  closePicker(false);
  setPaused(true, 'build');
  if (!state.paused) return;                                   // not a live moment (the pause was refused)
  pick.spot = i; pick.mode = mode;
  (mode === 'rank' ? upBtns : spotBtns)[i].setAttribute('aria-expanded', 'true');
  for (const c of pickCards) {
    c.hidden = mode === 'rank' || !pinAllowed(c.dataset.tower);   // this level's Pins; NEW on its first level
    c.classList.toggle('new', pinIsNew(c.dataset.tower));
    c.querySelector('.tcost').lastChild.textContent = pinCost(c.dataset.tower);
  }
  rankCard.hidden = mode !== 'rank';
  if (mode === 'rank') fillRankCard(state.towers[i]);
  picker.hidden = false; refreshPicker(true);
  placePicker(true);
  hideTip();
}
function fillRankCard(t) {
  const def = C.towers[t.type], q = s => rankCard.querySelector(s);
  rankCard.style.setProperty('--tc', def.color); rankCard.style.setProperty('--pfc', def.felt); rankCard.style.setProperty('--prim', rimOf(def.felt));
  q('.trank').textContent = C.pinRanks.names[t.rank] || '';
  q('.tname').textContent = def.name + ' ' + (C.pinRanks.names[t.rank] || '');
  q('.tsub').textContent = rankUpText(t).map(([k, v]) => k + ' ' + v).join(' · ');
  q('.tcost').lastChild.textContent = rankUpCost(t);
}
// Close it; resume = also end its pause (false when something else already ended it, or another picker opens next).
function closePicker(resume = true) {
  if (pick.spot < 0) return;
  spotBtns[pick.spot].setAttribute('aria-expanded', 'false'); upBtns[pick.spot].setAttribute('aria-expanded', 'false');
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
  const cards = pick.mode === 'rank' ? [rankCard] : pickCards.filter(c => !c.hidden), n = cards.length;
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
  if (pick.mode === 'rank') afford += state.thread >= rankUpCost(state.towers[pick.spot]) ? '1' : '0';
  if (!force && afford === pickAfford) return;
  pickAfford = afford;
  pickCards.forEach((c, i) => c.classList.toggle('poor', afford[i] !== '1'));
  if (pick.mode === 'rank') rankCard.classList.toggle('poor', afford[pickCards.length] !== '1');
}
function pickType(type) {
  if (pick.spot < 0) return;
  const why = buildTower(pick.spot, type);
  if (why === 'cost') toast(C.towers[type].name + ': need ' + (pinCost(type) - state.thread) + ' more thread (snip kills earn it)');
  else closePicker();
}
function pickRank() {
  if (pick.spot < 0) return;
  const t = state.towers[pick.spot], cost = rankUpCost(t), why = rankUp(pick.spot);
  if (why === 'cost') toast(C.towers[t.type].name + ' ' + C.pinRanks.names[t.rank] + ': need ' + (cost - state.thread) + ' more thread');
  else closePicker();
}

// A + tap while this level offers a Pin not introduced yet: pause on the explainer for just the new one(s) (normally
// the one this level brings; several only off the map or after Unlock all). The very first also explains building
// ("Pins help you snip", tap a +). GOT IT resumes with that spot's picker open.
let introSpot = -1;
function openPinIntro(i) {
  const fresh = Object.keys(C.towers).filter(pinUnseen), first = !tips.pins.length, def = C.towers[fresh[0]];
  tips.pins.push(...fresh); saveTips();
  introSpot = i; hideTip(); setAttn(false);
  const title = document.getElementById('pins-intro-title');
  title.textContent = title.dataset.text = first ? 'BUILDING PINS' : fresh.length > 1 ? 'NEW PINS' : 'NEW PIN';
  document.getElementById('pins-intro-lead').textContent = first ? 'Pins help you snip.' : 'A new Pin to build!';
  document.getElementById('pins-intro-howto').hidden = !first;
  document.getElementById('pins-intro-dot').setAttribute('fill', def.color);     // the diagram's picker shows the new Pin
  document.getElementById('pins-intro-name').textContent = def.name;
  for (const li of document.querySelectorAll('#pins-intro-list li[data-tower]')) li.hidden = !fresh.includes(li.dataset.tower);
  setPaused(true, 'pins');
}
function closePinIntro() {
  setPaused(false);
  if (introSpot >= 0 && !state.towers[introSpot].on) { spotsEl.hidden = false; openPicker(introSpot); }
  introSpot = -1;
}

// Slot i's badge tapped: use its move if it can be used (game.js useMove), else say why not.
function movePressed(i) {
  const s = state.moves[i];
  if (!s || !s.id || state.heli.active) return;
  if (s.id === 'shred') {
    const left = Math.ceil((1 - s.charge) * s.need - 0.01);
    if (!s.armed && left > 0) { toast('SHRED charges with snip kills: ' + left + ' to go'); return; }
  } else {
    const k = C.skills[s.id];
    if (s.id === 'basting') {
      const cost = s.def.bastingCost;
      if (!s.armed && state.thread < cost) { toast(k.name + ': ' + cost + ' thread a stitch, ' + (cost - state.thread) + ' to go'); return; }
    } else if (s.focusT > 0 || (s.id === 'thimble' && state.thimble > 0)) { toast(k.name + ' is on'); return; }
    else if (s.charge < 0.999 && s.marksLeft <= 0) { toast(k.name + ' charges with ' + k.charge + ': ' + Math.round(s.charge * 100) + '%'); return; }
  }
  useMove(i);
}

// On resize: where "+8" pickups fly (the thread counter), where each + button sits, and the open picker/tip.
export function measureActionBar() {
  const half = C.spotBtnPx / 2, up = C.spotBtnPx * 0.8, padR = level().spotR * view.L * view.Z;
  level().spots.forEach(([sx, sy], i) => {
    const b = spotBtns[i]; if (!b) return;
    const cx = (view.LX + sx * view.L) * view.Z, cy = sy * view.L * view.Z;
    b.style.left = (cx - half) + 'px'; b.style.top = (cy - half) + 'px';
    b.style.width = b.style.height = C.spotBtnPx + 'px';
    const u = upBtns[i];                                       // top right of the pad, clear of the Pin's charm
    u.style.left = (cx + padR * 0.75 - up / 2) + 'px'; u.style.top = (cy - padR * 0.75 - up / 2) + 'px';
    u.style.width = u.style.height = up + 'px';
  });
  if (pick.spot >= 0) placePicker();
  if (bar.hidden) return;
  const r = threadEl.getBoundingClientRect();
  view.pickupX = r.left + r.width / 2; view.pickupY = r.top + r.height / 2;
  if (tip.kind) placeTip();
}

// ---- per-frame refresh (only touches the DOM when something changed) ----
const shown = { visible: false, thread: -1, can: null, built: '', ranks: '' };
const shownMv = [0, 1].map(() => ({ on: null, id: '', key: '' }));   // per move badge: shown, its move, its last look
const tip = { kind: '', until: 0, anchor: null };
let runT0 = -1, tipPinsDone = false, tipShredDone = false, tipSnips = 0, specialsSeen = 0, attn = false, attnPin = '';
function setAttn(on) { attn = on; bar.classList.toggle('pin-attn', on); spotsEl.classList.toggle('attn', on); }

export function refreshActionBar() {
  const visible = !bar.hidden;
  if (visible !== shown.visible) {
    shown.visible = visible; spotsEl.hidden = !visible;
    if (visible) measureActionBar(); else closePicker();
  }
  if (!visible) { hideTip(); }
  for (let i = 0; i < moveCards.length; i++) refreshMove(i, visible);   // an empty slot (or none on this level) shows no badge
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
  let built = '', can = false, canNew = '';
  for (const t of state.towers) built += t.on ? '1' : '0';
  for (const type in C.towers) if (pinAllowed(type) && canAfford(type)) { can = true; if (!canNew && !tips.pins.includes(type)) canNew = type; }
  if (built !== shown.built) {
    shown.built = built;
    spotBtns.forEach((b, i) => { b.hidden = built[i] === '1'; });
    if (pick.spot >= 0 && pick.mode === 'build' && built[pick.spot] === '1') closePicker();
  }
  if (can !== shown.can) { shown.can = can; spotsEl.classList.toggle('can', can); }
  // rank-up buttons: on every built Pin below the top rank, lit while its next rank is affordable
  let ranks = '', rankAfford = -1;
  for (let i = 0; i < state.towers.length; i++) {
    const t = state.towers[i], cost = rankUpCost(t), ok = cost > 0 && state.thread >= cost;
    ranks += cost > 0 ? (ok ? 'a' : 'p') + t.rank : '0';
    if (ok && rankAfford < 0) rankAfford = i;
  }
  if (ranks !== shown.ranks) {
    shown.ranks = ranks;
    upBtns.forEach((b, i) => {
      const t = state.towers[i], cost = rankUpCost(t);
      b.hidden = !cost;
      if (cost) { b.classList.toggle('poor', state.thread < cost); b.firstChild.textContent = C.pinRanks.names[t.rank] || ''; b.title = 'Rank up: ' + cost + ' thread'; }
    });
    if (pick.spot >= 0 && pick.mode === 'rank') { if (!rankUpCost(state.towers[pick.spot])) closePicker(); else fillRankCard(state.towers[pick.spot]); }
  }
  if (rankAfford >= 0 && !tips.rank && pick.spot < 0 && !tip.kind) {   // once: the first affordable rank-up
    tips.rank = true; saveTips();
    showTip('rank', upBtns[rankAfford], 'Thread to spare? Tap a Pin’s ' + (C.pinRanks.names[1] || 'II') + ' to rank it up.', performance.now() + C.tipShowMs);
  }
  if (pick.spot >= 0 && !(state.paused && state.pauseCard === 'build')) closePicker(false);   // resumed some other way (⏸, P / Esc)
  if (pick.spot >= 0) refreshPicker(false);
  // new-Pin attention: enough thread for a Pin not introduced yet, and a free spot (after the wave banner)
  const nowAttn = !!canNew && built.includes('0') &&
    ((state.mode === 'PLAYING' && state.bannerT <= 0) || state.mode === 'WAVE_CLEAR');
  if (nowAttn !== attn) setAttn(nowAttn);
  attnPin = canNew;
  updateTip(built);
}
// Slot i's badge: shown while its slot holds a move; its ring = the charge (Focus: the time left while it runs; Thimble:
// the stops left; Basting: the Thread toward its price), gold while it can be used, red while armed.
function refreshMove(i, visible) {
  const s = state.moves[i], c = moveCards[i], sh = shownMv[i], on = visible && !!s.id;
  if (on !== sh.on || s.id !== sh.id) {
    sh.on = on; sh.id = s.id; sh.key = ''; c.hidden = !on;
    if (on) {
      const look = s.id === 'shred' ? C.shredBadge : C.skills[s.id];
      moveIcos[i].textContent = look.icon; c.style.setProperty('--sfc', look.felt); c.style.setProperty('--srim', rimOf(look.felt));
      c.classList.toggle('skill', s.id !== 'shred');
      moveCosts[i].hidden = s.id !== 'basting'; moveCosts[i].textContent = s.id === 'basting' ? s.def.bastingCost : '';
    }
  }
  if (!on) return;
  const shred = s.id === 'shred', basting = s.id === 'basting', cost = basting ? s.def.bastingCost : 0;
  const thimbleOn = s.id === 'thimble' && state.thimble > 0, active = s.focusT > 0 || thimbleOn;
  const p = basting ? Math.min(1, state.thread / cost) : s.focusT > 0 ? s.focusT / s.def.focusSec : thimbleOn ? state.thimble / s.def.thimbleStops : s.marksLeft > 0 ? 1 : s.charge;
  const ready = !basting && !active && !s.armed && moveReady(s), poor = basting && state.thread < cost;
  const key = Math.round(p * 100) + (ready ? 'r' : '') + (s.armed ? 'a' : '') + (active ? 'o' : '') + (poor ? 'p' : '');
  if (key === sh.key) return;
  sh.key = key;
  const name = shred ? 'SHRED' : C.skills[s.id].name, kills = Math.round(s.charge * s.need);
  c.style.setProperty('--p', Math.round(p * 100));
  c.classList.toggle('ready', ready); c.classList.toggle('armed', s.armed);
  c.classList.toggle('on', active); c.classList.toggle('poor', poor);
  c.setAttribute('aria-label', s.armed ? name + ' armed: tap to cancel' : active ? name + ' is on' : ready || (basting && !poor) ? name + ': tap to ' + (shred ? 'arm' : 'use') :
    shred ? 'SHRED ' + kills + ' of ' + s.need + ' kills' : name + ' ' + Math.round(p * 100) + '%');
}
chip.addEventListener('animationend', () => chip.classList.remove('bump'));

// What an armed move waits for, in words (Focus and Thimble never wait).
const ARMED_TIP = {
  shred: () => (touchy() ? 'Touch' : 'Click') + ' where you want to SHRED.',
  mark: () => (touchy() ? 'Tap' : 'Click') + ' an enemy to chalk-mark it.',
  pinking: () => 'Your next snip cuts a zigzag lane past the tips.',
  basting: s => 'Drag across the road to sew a stitch (' + s.def.bastingCost + ' thread).',
};
const MOVE_KEY = ['E', 'F'];                                // desktop keys of slot 1 and slot 2 (input.js)
let tipSlot = -1;                                           // the slot the current 'skill' ready tip is about
// A Skill slot full and waiting (not Basting, not armed, nothing running).
const skillFull = s => s.id && s.id !== 'shred' && s.id !== 'basting' && !s.armed && s.focusT <= 0 && !(s.id === 'thimble' && state.thimble > 0) && s.charge >= 0.999;
function updateTip(built) {
  const now = performance.now(), mv = state.moves;
  let armed = -1, shredAt = -1, fullNew = -1;
  for (let i = 0; i < mv.length; i++) {
    const s = mv[i];
    if (s.armed && armed < 0) armed = i;
    if (s.id === 'shred') shredAt = i;
    if (fullNew < 0 && skillFull(s) && !tips.skills.includes(s.id)) fullNew = i;
  }
  const ready = shredAt >= 0 && moveReady(mv[shredAt]);
  if (armed >= 0 && ARMED_TIP[mv[armed].id]) {
    showTip('armed', moveCards[armed], ARMED_TIP[mv[armed].id](mv[armed]), 0);
  } else if (fullNew >= 0) {                                   // once per Skill, ever: it's ready, here's how
    const s = mv[fullNew];
    tips.skills.push(s.id); saveTips(); tipSlot = fullNew;
    showTip('skill', moveCards[fullNew], C.skills[s.id].name + ' ready! Tap its badge' + (touchy() ? '.' : ' (or press ' + MOVE_KEY[fullNew] + ').'), now + C.skillTipMs);
    tipSnips = state.stats.snips;
  } else if (ready && !tips.shred && !tipShredDone && (tips.shredRuns || 0) < C.shredTipRuns) {
    tipShredDone = true; tips.shredRuns = (tips.shredRuns || 0) + 1; saveTips();
    showTip('shred', moveCards[shredAt], 'SHRED ready! Tap the meter to use it.', now + C.shredTipMs);
    tipSnips = state.stats.snips;
  } else if (attn && !tipPinsDone && pick.spot < 0) {
    tipPinsDone = true;
    const lead = tips.pins.length ? 'New: the ' + C.towers[attnPin].name + '! ' : 'You have enough Thread for a Pin! ';
    showTip('pins', spotBtns[built.indexOf('0')], lead + (touchy() ? 'Tap' : 'Click') + ' a + beside the road.', now + C.tipShowMs);
  }
  if (tip.kind && tip.until && now > tip.until) hideTip();
  if (tip.kind === 'shred' && (!ready || state.heli.active || armed >= 0 || state.stats.snips !== tipSnips)) hideTip();   // playing on dismisses it
  if (tip.kind === 'armed' && armed < 0) hideTip();
  if (tip.kind === 'skill' && (tipSlot < 0 || !skillFull(mv[tipSlot]) || state.stats.snips !== tipSnips)) hideTip();
  if (tip.kind === 'pins' && !attn) hideTip();
}
function showTip(kind, anchor, text, until) {
  if (tip.kind === kind && tipText.textContent === text) return;
  tip.kind = kind; tip.until = until; tip.anchor = anchor;
  tipText.textContent = text; tipEl.hidden = false;
  tipEl.classList.toggle('passthru', kind !== 'pins');   // the SHRED and Skill tips sit over the board: touches go through to the table
  placeTip();
}
// Centred over its anchor, kept on screen, the arrow pointing at the anchor. Anchors in the bar get the tip above
// the whole bar; a + button gets it just above itself; an anchor in the top half (a move meter) gets it below.
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

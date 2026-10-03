// The level map screen (TITLE -> MAP -> SELECT): five worlds (CONFIG.map.worlds, docs/worlds.md), one plate at a time,
// with the world's name over it and ‹ › arrows (or a sideways swipe) between them. A plate is drawn full height like the
// title plate (narrow screens crop its sides, wide ones get blurred side bars). A world with map art (`img`) gets a
// transparent button over each numbered patch; a world without art yet gets a felt stand-in drawn with CSS in its
// `look` colours: a plain felt plate with a stitched road through its patches, each a round felt button numbered 1..10
// (the 5th, the mini boss, and the 10th, the boss, CONFIG.map.bigNode bigger). Level 0 (the tutorial) is world 1's
// patch 0. Cleared levels get a gold check and their best stars, the next level to beat pulses, and the map opens on its
// world (refreshLevelMap(true)). Locks: with CONFIG.map.lockWorlds a world's patches stay locked until the previous
// world's level 10 is cleared (its name greys and the arrow toward it says what to clear); with CONFIG.map.locks a
// level also waits for the one before it; Save.unlocks.levels opens a level either way. A map level whose file isn't
// there yet shows its id and says so when tapped. Under the plate: BACK (Endless and Custom Road are off the map,
// on the title). Rewards won since the map was last open (Save.reveals: new scissors' card, Shop stock a clear put on
// sale, the credits, a world chest's contents) play over it, one tap each (revealNow plays one straight away
// elsewhere). Top left: the Buttons balance, Sewing Box, Shop and Trophies. Each world's chest (CONFIG.map.worlds[].chest
// for its place, CONFIG.meta.worlds for its cosmetic) sits on its plate: locked until every level of that world has
// three stars (a tap lists its fixed contents), then it glows; a tap opens it (meta.js openChest). DOM only.
import { CONFIG as C, VERSION } from './config.js';
import { clearedLevels } from './levelSelect.js';
import { levelInfo } from './levels/index.js';
import { Save, persist } from './save.js';
import { STORY } from './story.js';
import { PIN_ICON } from './actionBar.js';
import { pinTierText } from './armory.js';
import { sfxSequence } from './audio.js';
import { worldLevels, chestState, openChest, levelPlace, levelNo, mapIds, worldOpen, worldGate } from './meta.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const nodes = [], chests = [], layers = [];   // nodes: { id, b, world (index), g (global number) }
let toast = () => {}, onOpen = () => {}, onChange = () => {}, cur = 0;
const artEl = document.getElementById('map-art'), mapEl = document.getElementById('map');
const headEl = document.getElementById('map-world'), prevBtn = document.getElementById('map-prev'), nextBtn = document.getElementById('map-next');

// A smooth path through the patches (Catmull-Rom as cubic Béziers), for a stand-in plate's road.
function roadPath(pts) {
  let d = 'M' + pts[0][1] + ' ' + pts[0][2];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ' C' + (p1[1] + (p2[1] - p0[1]) / 6) + ' ' + (p1[2] + (p2[2] - p0[2]) / 6) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6) + ' ' +
      (p2[2] - (p3[2] - p1[2]) / 6) + ' ' + p2[1] + ' ' + p2[2];
  }
  return d;
}

// One world's layer: its patches (buttons), its chest and, for a stand-in, the road under them.
function buildWorld(W, wi, opts) {
  const layer = document.createElement('div');
  layer.className = 'map-layer'; layer.hidden = true;
  if (!W.img) {
    const svg = document.createElementNS(SVGNS, 'svg'), d = roadPath(W.nodes);
    svg.setAttribute('viewBox', '0 0 ' + W.w + ' ' + W.h); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('class', 'map-road');
    svg.innerHTML = '<path class="r-edge" d="' + d + '"/><path class="r-felt" d="' + d + '"/><path class="r-stitch" d="' + d + '"/>';
    layer.appendChild(svg);
  }
  for (const [id, x, y] of W.nodes) {
    const p = levelPlace(id), big = !W.img && (p.n === 5 || p.n === 10), k = big ? C.map.bigNode : 1;
    const w = W.hitW * k, h = W.hitH * k, b = document.createElement('button');
    b.type = 'button'; b.className = 'map-node' + (W.img ? '' : ' disc') + (big ? ' big' : '');
    b.style.setProperty('--x', x - w / 2); b.style.setProperty('--y', y - h / 2);
    b.style.setProperty('--w', w); b.style.setProperty('--h', h);
    b.innerHTML = '<span class="sr-only"></span><span class="num" aria-hidden="true"></span>' +
      '<span class="check" aria-hidden="true">✓</span><span class="lock" aria-hidden="true"></span>' +
      '<span class="stars" aria-hidden="true"><i></i><i></i><i></i></span>' +   // best stars (kit stars on the kit's star strip, index.html CSS)
      '<span class="here" aria-hidden="true"></span>';   // the kit's "you are here" pin, on the next level to beat
    b.firstChild.textContent = 'Level ' + levelNo(id) + ': ' + (levelInfo(id) ? levelInfo(id).name : id);
    b.querySelector('.num').textContent = String(p.n);   // the plates' patches are blank: the number is drawn here
    b.addEventListener('click', () => {
      if (b.dataset.why) { toast(b.dataset.why); return; }
      if (!levelInfo(id)) { toast('Level ' + levelNo(id) + ' (' + id + ') is still being sewn'); return; }
      opts.onPick(id);
    });
    layer.appendChild(b); nodes.push({ id, b, world: wi, g: p.global });
  }
  const M = C.meta.worlds[W.id];
  if (M && W.chest && C.meta.cosmetics[M.chest]) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'map-chest';
    b.style.setProperty('--x', W.chest.x); b.style.setProperty('--y', W.chest.y);
    b.innerHTML = '<span class="ch" aria-hidden="true"></span><span class="cap"></span>';
    const contents = C.meta.chestButtons + ' Buttons + ' + C.meta.cosmetics[M.chest].name, w = W.id;
    b.addEventListener('click', () => {
      const st = chestState(w);
      if (st === 'ready') { openChest(w); Save.reveals.push({ chest: w }); persist(); refreshLevelMap(); onChange(); }
      else if (st === 'opened') toast(M.name + ' chest: opened');
      else toast(M.name + ' chest: three-star all its levels for ' + contents);
    });
    layer.appendChild(b); chests.push({ w, b, contents });
  }
  artEl.appendChild(layer); layers.push(layer);
}

// onPick(id) when a level is chosen, onBack() for BACK, onOpen(screen, tab) for a reveal card's TO THE SHOP / TO THE
// SEWING BOX ('shop' | 'box'), onChange() after a chest paid out (the Buttons balance changed).
export function initLevelMap(opts) {
  toast = opts.toast; onOpen = opts.onOpen || onOpen; onChange = opts.onChange || onChange;
  C.map.worlds.forEach((W, wi) => buildWorld(W, wi, opts));
  prevBtn.addEventListener('click', () => showWorld(cur - 1));
  nextBtn.addEventListener('click', () => showWorld(cur + 1));
  // a sideways swipe across the plate turns to the next / previous world
  let sx = 0, sy = 0, down = false;
  artEl.addEventListener('pointerdown', e => { down = true; sx = e.clientX; sy = e.clientY; });
  artEl.addEventListener('pointerup', e => {
    if (!down) return; down = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) showWorld(cur + (dx < 0 ? 1 : -1));
  });
  document.getElementById('map-back').addEventListener('click', () => opts.onBack());
  revealEl.addEventListener('click', e => {
    if (e.target.closest('[data-send-feedback]')) return;   // the credits' Send feedback: main.js handles it, the card stays
    Save.reveals.shift(); persist();
    if (revealLeft > 0 && --revealLeft === 0) revealEl.hidden = true; else showReveal();
  });
}

// Show world i's plate (clamped): its art or felt stand-in, its layer, its name (greyed while locked) and the arrows
// (hidden at the ends; toward a locked world, greyed with a lock badge).
function showWorld(i) {
  const n = C.map.worlds.length;
  cur = Math.max(0, Math.min(n - 1, i));
  const W = C.map.worlds[cur], look = W.look || {};
  artEl.style.setProperty('--cw', W.w); artEl.style.setProperty('--ch', W.h);
  artEl.style.aspectRatio = W.w + ' / ' + W.h;
  artEl.classList.toggle('standin', !W.img);
  artEl.style.backgroundImage = W.img ? 'url(' + W.img + ')' : '';
  for (const k of ['ground', 'edge', 'road', 'felt', 'rim']) artEl.style.setProperty('--m-' + k, look[k] || '');
  mapEl.style.setProperty('--plate', W.img ? 'url(' + W.img + ')' : 'linear-gradient(' + (look.ground || '#333') + ', ' + (look.edge || '#111') + ')');
  artEl.setAttribute('aria-label', 'World ' + (cur + 1) + ': ' + W.name);
  layers.forEach((l, k) => { l.hidden = k !== cur; });
  const open = worldOpen(W.id);
  headEl.classList.toggle('locked', !open);
  document.getElementById('map-world-no').textContent = 'WORLD ' + (cur + 1);
  document.getElementById('map-world-name').textContent = W.name;
  const lockEl = document.getElementById('map-world-lock');
  lockEl.hidden = open; lockEl.textContent = open ? '' : 'Clear Level ' + levelNo(worldGate(W.id)) + ' to open';
  arrow(prevBtn, cur - 1, 'Previous world'); arrow(nextBtn, cur + 1, 'Next world');
}
function arrow(btn, i, what) {
  const W = C.map.worlds[i];
  btn.style.visibility = W ? '' : 'hidden';
  if (!W) return;
  const open = worldOpen(W.id);
  btn.classList.toggle('locked', !open);
  btn.setAttribute('aria-label', what + ': ' + W.name + (open ? '' : ' (locked: clear Level ' + levelNo(worldGate(W.id)) + ')'));
}

// Called each time the map opens (focusNext: turn to the world of the next level to beat) and after anything that
// changes it (a chest opened, a purchase): checks and best stars on cleared levels, a pulse on the next one, locks,
// the chests, the balance, then any waiting reward cards.
export function refreshLevelMap(focusNext = false) {
  const done = clearedLevels(), ids = mapIds(), unlocked = Save.unlocks.levels;
  const next = ids.findIndex(id => !done.has(id));
  for (const { id, b, world, g } of nodes) {
    const W = C.map.worlds[world], cleared = done.has(id);
    b.classList.toggle('cleared', cleared);
    const got = cleared ? Math.min(3, (Save.levels[id] || {}).stars || 0) : 0;
    b.querySelectorAll('.stars i').forEach((s, k) => s.classList.toggle('on', k < got));
    b.classList.toggle('next', g === next);
    b.classList.toggle('missing', !levelInfo(id));
    let why = '';
    if (!unlocked.includes(id)) {
      if (!worldOpen(W.id)) why = 'Clear Level ' + levelNo(worldGate(W.id)) + ' first';
      else if (C.map.locks && next >= 0 && g > next) why = 'Clear Level ' + levelNo(ids[g - 1]) + ' first';
    }
    b.dataset.why = why; b.classList.toggle('locked', !!why);
  }
  for (const { w, b, contents } of chests) {
    const st = chestState(w), lv = worldLevels(w), stars = lv.reduce((s, id) => s + Math.min(3, (Save.levels[id] || {}).stars || 0), 0);
    b.className = 'map-chest ' + w + ' ' + st;
    b.lastChild.textContent = st === 'opened' ? 'Opened' : st === 'ready' ? 'Open me!' : '★ ' + stars + '/' + lv.length * 3;
    b.setAttribute('aria-label', C.meta.worlds[w].name + ' chest (' + st + '): ' + contents);
  }
  if (focusNext && next >= 0) cur = Math.max(0, levelPlace(ids[next]).world - 1);
  showWorld(cur);
  document.getElementById('map-buttons').textContent = Save.buttons;
  showReveal();
}

// The first reward waiting in Save.reveals: new scissors (their own card: the art over spinning rays, the name, the
// story of why they turn up now, the blurb), a world chest's contents, or the credits. A tap dismisses it (and shows
// the next one, unless it was shown on its own by revealNow).
const revealEl = document.getElementById('reveal'), revealBody = document.getElementById('reveal-body');
let revealLeft = 0;          // revealNow: cards still to play before the card hides (0 = the map's queue plays on)
function showReveal() {
  const r = Save.reveals[0];
  revealEl.hidden = !r;
  if (!r) return;
  revealBody.textContent = '';
  const w = r.scissors && C.weapons[r.scissors], note = r.morning && STORY.morning[r.morning];
  if (note) {
    // the morning after a boss (story.js): where the note turned up, what the human wrote, what Tomato makes of it
    revealBody.innerHTML = '<div class="rv-kicker">THE MORNING AFTER</div><p class="rv-from"></p><div class="rv-note"></div>' +
      '<p class="rv-reply"><small></small><span></span></p><button class="felt-btn rv-ok" type="button">GOT IT</button>';
    revealBody.querySelector('.rv-from').textContent = note.from;
    const paper = revealBody.querySelector('.rv-note');
    paper.textContent = note.note; if (note.paper) paper.classList.add(note.paper);
    revealBody.querySelector('.rv-reply small').textContent = STORY.narrator.toUpperCase() + ' SAYS';
    revealBody.querySelector('.rv-reply span').textContent = note.reply;
  } else if (w) {
    revealBody.innerHTML = '<div class="rv-kicker">NEW SCISSORS!</div><img alt=""><div class="rv-name"></div><p class="rv-story"></p>' +
      '<p class="rv-blurb"></p><button class="felt-btn rv-ok" type="button">GOT IT</button>';
    revealBody.querySelector('img').src = w.svg;
    revealBody.querySelector('.rv-name').textContent = w.name;
    revealBody.querySelector('.rv-story').textContent = w.story || '';
    revealBody.querySelector('.rv-blurb').textContent = w.blurb;
  } else if (r.chest && C.meta.worlds[r.chest]) {
    const W = C.meta.worlds[r.chest], c = C.meta.cosmetics[W.chest];
    revealBody.innerHTML = '<div class="rv-credits"><h3></h3><p></p><p></p></div>';
    const [h, p1, p2] = revealBody.firstChild.children;
    h.textContent = W.name + ' chest!'; p1.textContent = '+' + C.meta.chestButtons + ' Buttons'; p2.textContent = c ? c.name + ' (wear it from the Shop)' : '';
  } else if ((r.shop && (r.shop === 'shred' || C.weapons[r.shop])) || (r.box && C.towers[r.box])) {
    // Stock a level clear put on sale (levelSelect.js): a pair in the Shop, or SHRED's / a Pin's tiers in the Sewing
    // Box. The big button opens that screen on that tab (the tap also closes the card, like any tap on it); LATER just
    // closes it.
    const w = r.shop && C.weapons[r.shop], pin = r.box && C.towers[r.box], t1 = C.shredTiers[1];
    revealBody.innerHTML = '<div class="rv-kicker"></div><img alt="" hidden><div class="rv-ico felt purple" hidden>✂</div><div class="rv-name"></div>' +
      '<p class="rv-story"></p><p class="rv-blurb"></p><div class="rv-row"><button class="felt-btn small" type="button">LATER</button>' +
      '<button class="felt-btn small rv-shop" type="button"></button></div>';
    const q = s => revealBody.querySelector(s);
    q('.rv-kicker').textContent = w ? 'NOW ON SALE' : 'NEW IN THE SEWING BOX';
    q('.rv-shop').textContent = w ? 'TO THE SHOP' : 'TO THE SEWING BOX';
    if (w) { q('img').hidden = false; q('img').src = w.svg; }
    else if (pin) { const ico = q('.rv-ico'); ico.hidden = false; ico.className = 'rv-ico felt pin'; ico.style.setProperty('--fc', pin.felt); ico.innerHTML = PIN_ICON[r.box] || ''; }
    else q('.rv-ico').hidden = false;
    q('.rv-name').textContent = w ? w.name : pin ? pin.name + ' tiers' : 'SHRED upgrades';
    q('.rv-story').textContent = w ? w.shop + ' Buttons, in the Shop.' :
      pin ? 'The ' + pin.name + ' can be made better for good: ' + [1, 2, 3].map(n => pinTierText(r.box, n)).join(', then ') + '.' :
      'SHRED can be upgraded now: ' + C.shredTiers.slice(1).map(t => t.name).join(', then ') + '.';
    q('.rv-blurb').textContent = w ? w.blurb : pin ? 'Tier 1: ' + pinTierText(r.box, 1) + ', ' + C.meta.pinTierCosts[0] + ' Buttons.' :
      t1.name + ': ' + (t1.turns === 2 ? 'two' : t1.turns) + ' spins before the snip, ' + C.meta.shredCosts[0] + ' Buttons.';
    q('.rv-shop').addEventListener('click', () => onOpen(w ? 'shop' : 'box', w ? 'pairs' : pin ? 'pins' : 'moves'));
  } else if (r.credits) {
    // The demo's end: say so plainly, then one more ask for feedback with a pointed question. The button is
    // data-send-feedback="demo" so main.js's delegated handler opens the draft with that question in the body.
    revealBody.innerHTML = '<div class="rv-credits"><h3>That&#39;s the demo!</h3><p>The Unstitcher is beaten and the quilt is safe.</p>' +
      '<p class="rv-demo">This is where the demo ends. Everything past here is still being sewn.</p>' +
      '<p class="rv-ask">One more favour: what was the <b>least fun</b> thing, and what should change?</p>' +
      '<button class="felt-btn rv-ok" type="button" data-send-feedback="demo"><span class="kico mail" aria-hidden="true"></span>Send feedback</button>' +
      '<p>Battle Scissors<br>Made by Tim Milazzo · Built with Claude Code</p>' +
      '<small>Lilita One font (SIL OFL) · ZzFX sound by Frank Force (MIT) · mulberry32 (public domain)<br>v' + VERSION + '</small></div>';
  } else { Save.reveals.shift(); persist(); showReveal(); return; }   // nothing to show for this entry
  sfxSequence('waveClear');
}
// Show waiting rewards right now, away from the map (the results card's unlock step, a Shop purchase): every entry
// matching `match` goes to the front, in its queue order, and plays, one tap each; the last tap closes the card
// without playing the rest (the map does those).
export function revealNow(match) {
  const picked = Save.reveals.filter(match); if (!picked.length) return;
  Save.reveals = picked.concat(Save.reveals.filter(r => !match(r))); persist();
  revealLeft = picked.length; showReveal();
}

// The level map screen (TITLE -> MAP -> SELECT): assets/level-map.webp drawn full height like the title plate (narrow
// screens crop its sides, wide ones get blurred side bars), with a button over each numbered patch (CONFIG.map.nodes).
// Cleared levels get a gold check and the next level to beat pulses; with CONFIG.map.locks, levels past that are
// locked (unless the save unlocked them: Save.unlocks.levels). Level 0 (the tutorial) has no patch in the art, so its
// button is a felt patch itself. Under the art: BACK, Random Quilt, and Custom Road when the URL has ?recipe=.
// Rewards won since the map was last open (Save.reveals: a weapon popping out, the credits, a world chest's contents)
// play over it, one tap each. Top left: the Buttons balance, Shop and Trophies (shop.js). A chest per world
// (CONFIG.meta.worlds) sits on the art: locked until every level of that world has three stars (a tap lists its
// fixed contents), then it glows; a tap opens it (meta.js openChest). The map grows in stages (CONFIG.map.stages): the
// current one (levelSelect mapStage) sets the art and how many patches show; each node and chest is placed in its own
// stage's art px and shifted by the `inner` offsets of the stages after it. The first time a stage shows, the map
// starts zoomed in so the old art fills the screen as before, then pulls back to reveal the new patches. DOM only.
import { CONFIG as C, VERSION } from './config.js';
import { clearedLevels, mapStage } from './levelSelect.js';
import { levelInfo, hasLevel } from './levels/index.js';
import { Save, persist } from './save.js';
import { sfxSequence } from './audio.js';
import { worldIds, worldLevels, chestState, openChest } from './meta.js';

const nodes = [], chests = [];
let toast = () => {}, shown = -1;                                 // shown = the stage the art is laid out for

// The first stage whose art holds node i; (x, y) in stage `from`'s art px -> stage `to`'s.
const nodeStage = i => C.map.stages.findIndex(st => i < st.levels);
function place(x, y, from, to) {
  for (let k = from + 1; k <= to; k++) { x += C.map.stages[k].inner[0]; y += C.map.stages[k].inner[1]; }
  return [x, y];
}
// Lay the map out for stage k: its art, its size, where every node and chest sits, which of them it shows.
function layout(k) {
  const art = document.getElementById('map-art'), M = C.map, st = M.stages[k];
  shown = k;
  art.style.setProperty('--cw', st.w); art.style.setProperty('--ch', st.h); art.style.aspectRatio = st.w + ' / ' + st.h;
  art.style.backgroundImage = 'url(' + st.img + ')';
  document.getElementById('map').style.setProperty('--plate', 'url(' + st.img + ')');
  M.nodes.forEach(([, x, y], i) => {
    const b = nodes[i], [px, py] = place(x, y, nodeStage(i), k);
    b.style.setProperty('--x', px - M.hitW / 2); b.style.setProperty('--y', py - M.hitH / 2);
    b.hidden = i >= st.levels;
  });
  for (const c of chests) {
    const W = C.meta.worlds[c.w], from = W.stage || 0, [px, py] = place(W.x, W.y, from, k);
    c.b.style.setProperty('--x', px); c.b.style.setProperty('--y', py);
    c.b.hidden = from > k;
  }
}

// onPick(id) when a level is chosen, onBack() for BACK.
export function initLevelMap(opts) {
  toast = opts.toast;
  const art = document.getElementById('map-art'), M = C.map;
  M.nodes.forEach(([id], i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'map-node';
    b.style.setProperty('--w', M.hitW); b.style.setProperty('--h', M.hitH);
    b.innerHTML = '<span class="sr-only"></span><span class="check" aria-hidden="true">✓</span><span class="lock" aria-hidden="true"></span>' +
      '<span class="stars" aria-hidden="true"><i></i><i></i><i></i></span>';   // best stars (kit stars, index.html CSS)
    b.firstChild.textContent = 'Level ' + i + ': ' + (levelInfo(id) ? levelInfo(id).name : id);
    b.addEventListener('click', () => {
      if (b.classList.contains('locked')) { toast('Clear level ' + (i - 1) + ' first'); return; }
      opts.onPick(id);
    });
    art.appendChild(b); nodes.push(b);
  });
  for (const w of worldIds()) {
    const W = C.meta.worlds[w]; if (!W) continue;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'map-chest';
    b.innerHTML = '<span class="ch" aria-hidden="true"></span><span class="cap"></span>';
    const contents = C.meta.chestButtons + ' Buttons + ' + C.meta.cosmetics[W.chest].name;
    b.addEventListener('click', () => {
      const st = chestState(w);
      if (st === 'ready') { openChest(w); Save.reveals.push({ chest: w }); persist(); refreshLevelMap(); }
      else if (st === 'opened') toast(W.name + ' chest: opened');
      else toast(W.name + ' chest: three-star all its levels for ' + contents);
    });
    art.appendChild(b); chests.push({ w, b, contents });
  }
  document.getElementById('map-back').addEventListener('click', () => opts.onBack());
  document.getElementById('map-random').addEventListener('click', () => opts.onPick('random'));
  const custom = document.getElementById('map-custom');
  custom.hidden = !hasLevel('custom');
  custom.addEventListener('click', () => opts.onPick('custom'));
  revealEl.addEventListener('click', () => { if (growing) return; Save.reveals.shift(); persist(); showReveal(); });
}

// Called each time the map opens: checks and best stars on cleared levels, a pulse on the next one, locks past it (if
// on).
export function refreshLevelMap() {
  const stage = mapStage();
  if (stage !== shown) layout(stage);
  const done = clearedLevels(), ids = C.map.nodes.slice(0, C.map.stages[stage].levels).map(n => n[0]);
  const next = ids.findIndex(id => !done.has(id));
  nodes.forEach((b, i) => {
    if (i >= ids.length) return;
    b.classList.toggle('cleared', done.has(ids[i]));
    const got = done.has(ids[i]) ? Math.min(3, (Save.levels[ids[i]] || {}).stars || 0) : 0;
    b.querySelectorAll('.stars i').forEach((s, k) => s.classList.toggle('on', k < got));
    b.classList.toggle('next', i === next);
    b.classList.toggle('locked', C.map.locks && next >= 0 && i > next && !Save.unlocks.levels.includes(ids[i]));
  });
  for (const { w, b, contents } of chests) {
    const st = chestState(w), lv = worldLevels(w), stars = lv.reduce((s, id) => s + Math.min(3, (Save.levels[id] || {}).stars || 0), 0);
    b.className = 'map-chest ' + st;
    b.lastChild.textContent = st === 'opened' ? 'Opened' : st === 'ready' ? 'Open me!' : '★ ' + stars + '/' + lv.length * 3;
    b.setAttribute('aria-label', C.meta.worlds[w].name + ' chest (' + st + '): ' + contents);
  }
  document.getElementById('map-buttons').textContent = Save.buttons;
  showReveal();
}

// The zoom-out when the map grows to stage k (a Save.reveals entry, once): the stage-k art starts scaled up about the
// point that puts the old art exactly where it was (full height, centred), holds a moment, then eases out to show the
// whole quilt; the new patches (and any new chest) pop in at the end, then the reveal card explains it.
let growing = false;
const grown = new Set();
function growMap(k) {
  if (shown !== k) layout(k);
  const art = document.getElementById('map-art'), st = C.map.stages[k], prev = C.map.stages[k - 1], [ix, iy] = st.inner;
  const s = st.h / prev.h, ox = (ix + prev.w / 2) / st.w * 100, oy = st.h > prev.h ? iy / (st.h - prev.h) * 100 : 50;
  const fresh = nodes.slice(prev.levels, st.levels).concat(chests.filter(c => (C.meta.worlds[c.w].stage || 0) === k).map(c => c.b));
  growing = true; revealEl.hidden = true;
  for (const b of fresh) b.classList.add('unsewn');
  art.style.transformOrigin = ox + '% ' + oy + '%';
  const anim = art.animate([{ transform: 'scale(' + s + ')' }, { transform: 'scale(1)' }],
    { duration: C.map.zoomMs, delay: 700, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'backwards' });
  anim.onfinish = () => {
    for (const b of fresh) { b.classList.remove('unsewn'); b.classList.add('sewn'); }
    sfxSequence('waveClear');
    setTimeout(() => { for (const b of fresh) b.classList.remove('sewn'); growing = false; grown.add(k); showReveal(); }, 900);
  };
}

// The first reward waiting in Save.reveals: the weapon's art and name over spinning rays, or the credits. A tap
// dismisses it (and shows the next one).
const revealEl = document.getElementById('reveal'), revealBody = document.getElementById('reveal-body');
function showReveal() {
  if (growing) { revealEl.hidden = true; return; }                // the map is zooming out; its card comes after
  const r = Save.reveals[0];
  revealEl.hidden = !r;
  if (!r) return;
  revealBody.textContent = '';
  const w = r.scissors && C.weapons[r.scissors];
  if (w) {
    const img = document.createElement('img'), name = document.createElement('div');
    img.src = w.svg; img.alt = '';
    name.className = 'rv-name'; name.textContent = w.name;
    revealBody.append(img, name);
  } else if (r.chest && C.meta.worlds[r.chest]) {
    const W = C.meta.worlds[r.chest], c = C.meta.cosmetics[W.chest];
    revealBody.innerHTML = '<div class="rv-credits"><h3></h3><p></p><p></p></div>';
    const [h, p1, p2] = revealBody.firstChild.children;
    h.textContent = W.name + ' chest!'; p1.textContent = '+' + C.meta.chestButtons + ' Buttons'; p2.textContent = c ? c.name + ' (wear it from the Shop)' : '';
  } else if (r.mapStage) {
    if (!grown.has(r.mapStage)) { growMap(r.mapStage); return; }  // the zoom-out first, then this card
    const st = C.map.stages[r.mapStage], prev = C.map.stages[r.mapStage - 1];
    revealBody.innerHTML = '<div class="rv-credits"><h3>The quilt grows!</h3><p></p><p>The quilt keeps growing: bigger roads, and more of them, the further you go.</p></div>';
    revealBody.firstChild.children[1].textContent = 'Levels ' + prev.levels + '\u2013' + (st.levels - 1) + ' are sewn on.';
  } else if (r.credits) {
    revealBody.innerHTML = '<div class="rv-credits"><h3>The End!</h3><p>The Unstitcher is beaten and the quilt is safe.</p>' +
      '<p>Battle Scissors</p><p>Made by Tim Milazzo</p><p>Built with Claude Code</p>' +
      '<small>Lilita One font (SIL OFL) · ZzFX sound by Frank Force (MIT) · mulberry32 (public domain)<br>v' + VERSION + '</small></div>';
  } else { Save.reveals.shift(); persist(); showReveal(); return; }   // nothing to show for this entry
  sfxSequence('waveClear');
}

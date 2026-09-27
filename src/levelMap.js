// The level map screen (TITLE -> MAP -> SELECT): assets/level-map.webp drawn full height like the title plate (narrow
// screens crop its sides, wide ones get blurred side bars), with a button over each numbered patch (CONFIG.map.nodes).
// Cleared levels get a gold check and the next level to beat pulses; with CONFIG.map.locks, levels past that are
// locked (unless the save unlocked them: Save.unlocks.levels). Level 0 (the tutorial) has no patch in the art, so its
// button is a felt patch itself. Under the art: BACK, Random Quilt, and Custom Road when the URL has ?recipe=.
// Rewards won since the map was last open (Save.reveals: a weapon popping out, the credits, a world chest's contents)
// play over it, one tap each. Top left: the Buttons balance, Shop and Trophies (shop.js). A chest per world
// (CONFIG.meta.worlds) sits on the art: locked until every level of that world has three stars (a tap lists its
// fixed contents), then it glows; a tap opens it (meta.js openChest). DOM only.
import { CONFIG as C, VERSION } from './config.js';
import { clearedLevels } from './levelSelect.js';
import { levelInfo, hasLevel } from './levels/index.js';
import { Save, persist } from './save.js';
import { sfxSequence } from './audio.js';
import { worldIds, worldLevels, chestState, openChest } from './meta.js';

const nodes = [], chests = [];
let toast = () => {};

// onPick(id) when a level is chosen, onBack() for BACK.
export function initLevelMap(opts) {
  toast = opts.toast;
  const art = document.getElementById('map-art'), M = C.map;
  art.style.setProperty('--cw', M.w); art.style.setProperty('--ch', M.h);
  art.style.backgroundImage = 'url(' + M.img + ')';
  document.getElementById('map').style.setProperty('--plate', 'url(' + M.img + ')');
  M.nodes.forEach(([id, x, y], i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'map-node' + (id === C.tutLevel ? ' sewn' : '');
    b.style.setProperty('--x', x - M.hitW / 2); b.style.setProperty('--y', y - M.hitH / 2);
    b.style.setProperty('--w', M.hitW); b.style.setProperty('--h', M.hitH);
    b.innerHTML = '<span class="sr-only"></span><span class="check" aria-hidden="true">✓</span><span class="lock" aria-hidden="true"></span>' +
      '<span class="stars" aria-hidden="true"><i></i><i></i><i></i></span>';   // best stars (kit stars, index.html CSS)
    b.firstChild.textContent = 'Level ' + i + ': ' + (levelInfo(id) ? levelInfo(id).name : id);
    if (id === C.tutLevel) b.insertAdjacentHTML('beforeend', '<span class="num" aria-hidden="true">' + i + '</span>');
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
    b.style.setProperty('--x', W.x); b.style.setProperty('--y', W.y);
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
  revealEl.addEventListener('click', () => { Save.reveals.shift(); persist(); showReveal(); });
}

// Called each time the map opens: checks and best stars on cleared levels, a pulse on the next one, locks past it (if
// on).
export function refreshLevelMap() {
  const done = clearedLevels(), ids = C.map.nodes.map(n => n[0]);
  const next = ids.findIndex(id => !done.has(id));
  nodes.forEach((b, i) => {
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

// The first reward waiting in Save.reveals: the weapon's art and name over spinning rays, or the credits. A tap
// dismisses it (and shows the next one).
const revealEl = document.getElementById('reveal'), revealBody = document.getElementById('reveal-body');
function showReveal() {
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
  } else if (r.credits) {
    revealBody.innerHTML = '<div class="rv-credits"><h3>The End!</h3><p>The Unstitcher is beaten and the quilt is safe.</p>' +
      '<p>Battle Scissors</p><p>Made by Tim Milazzo</p><p>Built with Claude Code</p>' +
      '<small>Lilita One font (SIL OFL) · ZzFX sound by Frank Force (MIT) · mulberry32 (public domain)<br>v' + VERSION + '</small></div>';
  } else { Save.reveals.shift(); persist(); showReveal(); return; }   // nothing to show for this entry
  sfxSequence('waveClear');
}

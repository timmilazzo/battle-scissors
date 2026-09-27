// The level map screen (TITLE -> MAP -> SELECT): assets/level-map.webp drawn full height like the title plate (narrow
// screens crop its sides, wide ones get blurred side bars), with a button over each numbered patch (CONFIG.map.nodes).
// Cleared levels get a gold check and the next level to beat pulses; with CONFIG.map.locks, levels past that are
// locked. Under the art: BACK, Random Quilt, and Custom Road when the URL has ?recipe=. DOM only.
import { CONFIG as C } from './config.js';
import { clearedLevels } from './levelSelect.js';

const nodes = [];
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
    b.type = 'button'; b.className = 'map-node';
    b.style.setProperty('--x', x - M.hitW / 2); b.style.setProperty('--y', y - M.hitH / 2);
    b.style.setProperty('--w', M.hitW); b.style.setProperty('--h', M.hitH);
    b.innerHTML = '<span class="sr-only"></span><span class="check" aria-hidden="true">✓</span><span class="lock" aria-hidden="true"></span>';
    b.firstChild.textContent = 'Level ' + (i + 1) + ': ' + (C.levels[id] ? C.levels[id].name : id);
    b.addEventListener('click', () => {
      if (b.classList.contains('locked')) { toast('Clear level ' + i + ' first'); return; }
      opts.onPick(id);
    });
    art.appendChild(b); nodes.push(b);
  });
  document.getElementById('map-back').addEventListener('click', () => opts.onBack());
  document.getElementById('map-random').addEventListener('click', () => opts.onPick('random'));
  const custom = document.getElementById('map-custom');
  custom.hidden = !C.levels.custom;
  custom.addEventListener('click', () => opts.onPick('custom'));
}

// Called each time the map opens: checks on cleared levels, a pulse on the next one, locks past it (if on).
export function refreshLevelMap() {
  const done = clearedLevels(), ids = C.map.nodes.map(n => n[0]);
  const next = ids.findIndex(id => !done.has(id));
  nodes.forEach((b, i) => {
    b.classList.toggle('cleared', done.has(ids[i]));
    b.classList.toggle('next', i === next);
    b.classList.toggle('locked', C.map.locks && next >= 0 && i > next);
  });
}

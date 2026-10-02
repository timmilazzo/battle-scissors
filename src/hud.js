// The top-left HUD (DOM, felt style like the title buttons): wave badge (with the map level's number on top) and a DULL
// badge while the weapon in use is in its dullest sharpness band (scissors.js sharpBandIndex); the SHRED meter sits in
// the same column (actionBar.js). The workshop's HP isn't here: the heart pad at the end of the road shows it
// (render.js drawHeart). Shown during PLAYING / WAVE_CLEAR / GAME_OVER (not level 0). Only touches the DOM when a value changes.
import { CONFIG as C } from './config.js';
import { view } from './core.js';
import { state, levelWaves } from './game.js';
import { sharpBandIndex } from './scissors.js';

const hudEl = document.getElementById('hud'), waveEl = document.getElementById('hud-wave'), levelEl = document.getElementById('hud-level');
const dullEl = document.getElementById('hud-dull');
const shown = { visible: false, wave: -1, waves: -1, dull: null, level: null };

export function refreshHud() {
  const m = state.mode, visible = m === 'PLAYING' || m === 'WAVE_CLEAR' || m === 'GAME_OVER';
  if (visible !== shown.visible) { shown.visible = visible; hudEl.hidden = !visible; }
  if (!visible) return;
  const dull = sharpBandIndex(state.sharpAtStart) === 0;         // snips do less damage this run
  if (dull !== shown.dull) { shown.dull = dull; dullEl.hidden = !dull; }
  if (shown.level !== view.levelId) {                              // "LEVEL 8" for a map level; none for Random Quilt / Custom Road
    shown.level = view.levelId;
    const i = C.map.nodes.findIndex(nd => nd[0] === view.levelId);
    levelEl.hidden = i < 0; levelEl.textContent = 'LEVEL ' + i;
  }
  const n = levelWaves().length;
  if (shown.wave !== state.wave || shown.waves !== n) { shown.wave = state.wave; shown.waves = n; waveEl.textContent = state.wave + '/' + n; }
}

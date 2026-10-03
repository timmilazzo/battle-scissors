// The top-left HUD (DOM, felt style like the title buttons): wave badge (with the map level's number on top) and a DULL
// badge while the weapon in use is in its dullest sharpness band (scissors.js sharpBandIndex); the two move slots' meters sit in
// the same column (actionBar.js). The workshop's HP isn't here: the heart pad at the end of the road shows it
// (render.js drawHeart). Shown during PLAYING / WAVE_CLEAR / GAME_OVER (not level 0). Only touches the DOM when a value changes.
import { view } from './core.js';
import { state, levelWaves, isEndless } from './game.js';
import { sharpBandIndex } from './scissors.js';
import { levelNo } from './meta.js';

const hudEl = document.getElementById('hud'), waveEl = document.getElementById('hud-wave'), levelEl = document.getElementById('hud-level');
const dullEl = document.getElementById('hud-dull'), killsRow = document.getElementById('hud-kills-row'), killsEl = document.getElementById('hud-kills');
const shown = { visible: false, wave: -1, waves: -1, dull: null, level: null, endless: null, kills: -1 };

export function refreshHud() {
  const m = state.mode, visible = m === 'PLAYING' || m === 'WAVE_CLEAR' || m === 'GAME_OVER';
  if (visible !== shown.visible) { shown.visible = visible; hudEl.hidden = !visible; }
  if (!visible) return;
  const dull = sharpBandIndex(state.sharpAtStart) === 0;         // snips do less damage this run
  if (dull !== shown.dull) { shown.dull = dull; dullEl.hidden = !dull; }
  if (shown.level !== view.levelId) {                              // "LEVEL 2-3" for a map level; none for Random Quilt / Custom Road
    shown.level = view.levelId;
    const no = levelNo(view.levelId);
    levelEl.hidden = !no; levelEl.textContent = 'LEVEL ' + no;
  }
  const endless = isEndless(), n = endless ? -2 : levelWaves().length;   // endless: "n/∞" and the kill count under it
  if (shown.wave !== state.wave || shown.waves !== n) { shown.wave = state.wave; shown.waves = n; waveEl.textContent = state.wave + '/' + (endless ? '∞' : n); }
  if (shown.endless !== endless) { shown.endless = endless; killsRow.hidden = !endless; }
  if (endless && shown.kills !== state.stats.kills) { shown.kills = state.stats.kills; killsEl.textContent = String(shown.kills); }
}

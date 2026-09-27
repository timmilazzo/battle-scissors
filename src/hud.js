// The top-left HUD (DOM, felt style like the title buttons): wave badge, the workshop's hearts as one heart + a count,
// and a SHARP badge while a Sharpening (meta.js) is in use.
// Shown during PLAYING / WAVE_CLEAR / GAME_OVER, and in level 0 (TUTORIAL) as the hearts alone. Only touches the DOM
// when a value changes.
import { CONFIG as C } from './config.js';
import { state, levelWaves } from './game.js';

const hudEl = document.getElementById('hud'), waveEl = document.getElementById('hud-wave');
const heartsEl = document.getElementById('hud-hearts'), heartEl = heartsEl.querySelector('.heart'), hpEl = document.getElementById('hud-hp');
const waveBadge = waveEl.parentElement, sharpEl = document.getElementById('hud-sharp');
const shown = { visible: false, wave: -1, waves: -1, hp: -1, tut: null, sharp: null };

heartEl.addEventListener('animationend', () => heartEl.classList.remove('pop'));
hpEl.addEventListener('animationend', () => hpEl.classList.remove('bump'));

export function refreshHud() {
  const m = state.mode, tut = m === 'TUTORIAL', visible = tut || m === 'PLAYING' || m === 'WAVE_CLEAR' || m === 'GAME_OVER';
  if (visible !== shown.visible) { shown.visible = visible; hudEl.hidden = !visible; }
  if (!visible) return;
  if (tut !== shown.tut) { shown.tut = tut; waveBadge.hidden = tut; }
  if (state.sharpened !== shown.sharp) { shown.sharp = state.sharpened; sharpEl.hidden = !state.sharpened; }   // a Sharpening is in use
  const n = levelWaves().length;
  if (shown.wave !== state.wave || shown.waves !== n) { shown.wave = state.wave; shown.waves = n; waveEl.textContent = state.wave + '/' + n; }
  if (shown.hp !== state.hp) {
    if (state.hp < shown.hp) {                                    // just lost one: the heart flashes, the number bumps
      heartEl.classList.remove('pop'); hpEl.classList.remove('bump'); void heartEl.offsetWidth;
      heartEl.classList.add('pop'); hpEl.classList.add('bump');
    }
    shown.hp = state.hp; hpEl.textContent = String(Math.max(0, state.hp));
    heartEl.classList.toggle('lost', state.hp <= 0);
    heartsEl.classList.toggle('low', state.hp <= C.hudLowHp);
    heartsEl.setAttribute('aria-label', 'Workshop health ' + state.hp + ' of ' + C.workshopHp);
  }
}

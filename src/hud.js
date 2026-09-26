// The top-left HUD (DOM, felt style like the title buttons): wave badge and the workshop's hearts as one heart + a count.
// Shown during PLAYING / WAVE_CLEAR / GAME_OVER. Only touches the DOM when a value changes.
import { CONFIG as C } from './config.js';
import { state } from './game.js';

const hudEl = document.getElementById('hud'), waveEl = document.getElementById('hud-wave');
const heartsEl = document.getElementById('hud-hearts'), heartEl = heartsEl.querySelector('.heart'), hpEl = document.getElementById('hud-hp');
const shown = { visible: false, wave: -1, hp: -1 };

heartEl.addEventListener('animationend', () => heartEl.classList.remove('pop'));
hpEl.addEventListener('animationend', () => hpEl.classList.remove('bump'));

export function refreshHud() {
  const m = state.mode, visible = m === 'PLAYING' || m === 'WAVE_CLEAR' || m === 'GAME_OVER';
  if (visible !== shown.visible) { shown.visible = visible; hudEl.hidden = !visible; }
  if (!visible) return;
  if (shown.wave !== state.wave) { shown.wave = state.wave; waveEl.textContent = state.wave + '/' + C.waves.length; }
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

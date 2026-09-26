// The top-left HUD (DOM, felt style like the title buttons): wave badge, score pill, workshop hearts.
// Shown during PLAYING / WAVE_CLEAR / GAME_OVER. Only touches the DOM when a value changes.
import { CONFIG as C } from './config.js';
import { state } from './game.js';

const hudEl = document.getElementById('hud'), waveEl = document.getElementById('hud-wave'), scoreEl = document.getElementById('hud-score');
const heartsEl = document.getElementById('hud-hearts'), hearts = [];
const shown = { visible: false, wave: -1, score: -1, hp: -1, max: -1 };

function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
for (const el of [scoreEl.parentElement]) el.addEventListener('animationend', () => el.classList.remove('bump'));

export function refreshHud() {
  const m = state.mode, visible = m === 'PLAYING' || m === 'WAVE_CLEAR' || m === 'GAME_OVER';
  if (visible !== shown.visible) { shown.visible = visible; hudEl.hidden = !visible; }
  if (!visible) return;
  if (shown.max !== C.workshopHp) {                               // (re)build the hearts row
    shown.max = C.workshopHp; shown.hp = -1;
    heartsEl.textContent = ''; hearts.length = 0;
    for (let i = 0; i < C.workshopHp; i++) {
      const h = document.createElement('span'); h.className = 'heart';
      h.addEventListener('animationend', () => h.classList.remove('pop'));
      heartsEl.appendChild(h); hearts.push(h);
    }
  }
  if (shown.wave !== state.wave) { shown.wave = state.wave; waveEl.textContent = state.wave + '/' + C.waves.length; }
  if (shown.score !== state.score) {
    if (state.score > shown.score && shown.score >= 0) bump(scoreEl.parentElement);
    shown.score = state.score; scoreEl.textContent = String(state.score);
  }
  if (shown.hp !== state.hp) {
    hearts.forEach((h, i) => {
      const lost = i >= state.hp;
      if (lost && !h.classList.contains('lost') && shown.hp >= 0) h.classList.add('pop');   // the heart just lost flashes
      h.classList.toggle('lost', lost);
    });
    shown.hp = state.hp; heartsEl.setAttribute('aria-label', 'Workshop health ' + state.hp + ' of ' + C.workshopHp);
  }
}

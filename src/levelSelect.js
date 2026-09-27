// Level picker on the select screen (above the weapon cards): one card per CONFIG.levels entry, a crop of its plate plus
// its name and blurb. ?level=id in the URL wins (the run report's replay link carries it); otherwise the last pick,
// remembered in localStorage (per-device convenience only).
import { CONFIG as C } from './config.js';

const STORE_KEY = 'battleScissors.level';
const urlLevel = new URLSearchParams(location.search).get('level');

export function savedLevel() {
  if (urlLevel && C.levels[urlLevel]) return urlLevel;
  try { const id = localStorage.getItem(STORE_KEY); if (id && C.levels[id]) return id; } catch (e) { /* storage blocked */ }
  return C.defaultLevel;
}

const cards = {};

// onPick(id) when a card is chosen; current = the level already in play.
export function initLevelSelect({ onPick, current }) {
  const list = document.getElementById('level-cards');
  for (const id in C.levels) {
    const lv = C.levels[id];
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'weapon-card level-card'; card.setAttribute('role', 'radio');
    card.innerHTML = '<img alt=""><span class="lc-text"><span class="wc-name"></span><span class="wc-blurb"></span></span>';
    card.querySelector('img').src = lv.bg;
    card.querySelector('.wc-name').textContent = lv.name;
    card.querySelector('.wc-blurb').textContent = lv.blurb;
    card.addEventListener('click', () => { if (card.getAttribute('aria-checked') !== 'true') { select(id); onPick(id); } });
    list.appendChild(card);
    cards[id] = card;
  }
  for (const k in cards) cards[k].setAttribute('aria-checked', String(k === current));
}
// Mark `id` as the chosen level and remember it (a card tap, or NEXT LEVEL on the win card).
export function select(id) {
  for (const k in cards) cards[k].setAttribute('aria-checked', String(k === id));
  try { localStorage.setItem(STORE_KEY, id); } catch (e) { /* storage blocked */ }
}

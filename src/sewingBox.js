// The Sewing Box screen (DOM only): what the player holds and the Buttons spent on making it better. Opens from the
// level map's top row and the weapon select screen; closes back to whichever screen opened it. Three tabs (the last
// one picked stays picked), all built by armory.js: Scissors (every pair held: equip, Sharpen, its three upgrade tiers),
// Pins (each Pin type's permanent tiers, on sale once its level is cleared) and Moves (SHRED's tiers, skills to come).
// A gold dot on a tab = something there the balance covers (meta.js deals(), screen 'box'); rendering a tab marks its
// deals seen (markDealsSeen), which puts out the dot on the Sewing Box's entrances (main.js refreshNews). Buying new
// things (pairs on sale, cosmetics) is the Shop's job (shop.js).
import { Save } from './save.js';
import { deals, markDealsSeen } from './meta.js';
import { unlockAudio } from './audio.js';
import { scissorsTab, pinsTab, movesTab } from './armory.js';

const boxEl = document.getElementById('box'), boxBody = document.getElementById('box-body'), boxBal = document.getElementById('box-buttons');
const tabBtns = [...document.querySelectorAll('#box-tabs [data-tab]')];
let tab = 'scissors';

const TABS = { scissors: scissorsTab, pins: pinsTab, moves: movesTab };
function renderBox() {
  boxBal.textContent = Save.buttons;
  const ds = deals();
  for (const b of tabBtns) {
    const k = b.dataset.tab;
    b.setAttribute('aria-selected', String(k === tab));
    b.querySelector('.dot').hidden = k === tab || !ds.some(d => d.screen === 'box' && d.tab === k);
  }
  boxBody.textContent = '';
  TABS[tab](boxBody);
  markDealsSeen('box', tab);
}

export function refreshBox() { if (!boxEl.hidden) renderBox(); }

// opts: onClose() after BACK (the screen that opened it refreshes).
export function initBox(opts) {
  for (const b of tabBtns) b.addEventListener('click', () => {
    if (tab === b.dataset.tab) return;
    unlockAudio(); tab = b.dataset.tab; renderBox(); boxEl.scrollTop = 0;
  });
  document.getElementById('box-back').addEventListener('click', () => { boxEl.hidden = true; opts.onClose(); });
}
// which: a tab to open on ('scissors' | 'pins' | 'moves'); omitted, the last one picked.
export function openBox(which) { if (TABS[which]) tab = which; boxEl.hidden = false; renderBox(); boxEl.scrollTop = 0; }

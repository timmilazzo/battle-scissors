// The results card's Button tally (DOM only), played when a run ends (game.js endGame -> main.js). In order, one step
// every CONFIG.meta.tallyStepMs: the three stars animate in (gold = new, paying its Buttons; grey = already earned on
// an earlier run, pays nothing), then the Buttons by source (stars / score bonus / each achievement unlocked this run),
// then the total, then the unlock reveal (a new weapon, a world chest ready), then the buttons (CONTINUE...).
// A tap on the card skips to the end.
import { CONFIG as C } from './config.js';
import { Save, persist } from './save.js';
import { sfx, sfxSequence } from './audio.js';

const card = document.querySelector('#over .card'), starEls = [...document.querySelectorAll('#res-stars .rs')];
const noteEl = document.getElementById('res-note'), tallyEl = document.getElementById('res-tally');
const totalEl = document.getElementById('res-total'), unlockEl = document.getElementById('res-unlock');
let steps = [], timer = 0;

function runStep() {
  timer = 0;
  const f = steps.shift();
  if (!f) { card.classList.remove('tallying'); return; }
  f();
  timer = setTimeout(runStep, C.meta.tallyStepMs);
}
function finish() {
  clearTimeout(timer); timer = 0;
  while (steps.length) steps.shift()();
  card.classList.remove('tallying');
}
card.addEventListener('pointerdown', () => { if (card.classList.contains('tallying')) finish(); });

const row = (label, n, cls = '', sub = '') => {
  const li = document.createElement('li');
  li.className = cls;
  li.innerHTML = '<span></span><b></b>';
  li.firstChild.textContent = label;
  if (sub) { const s = document.createElement('small'); s.textContent = ' ' + sub; li.firstChild.appendChild(s); }
  li.lastChild.textContent = '+' + n;
  return li;
};

// t = meta.js settleRun's tally (+ unlock: the level's unlockOnClear on a first win, or null).
export function showResults(t) {
  clearTimeout(timer);
  steps = [];
  tallyEl.textContent = ''; totalEl.textContent = ''; noteEl.textContent = ''; unlockEl.hidden = true; unlockEl.textContent = '';
  card.classList.add('tallying');
  const M = C.meta;
  starEls.forEach((el, i) => {
    el.className = 'rs ' + t.stars[i]; el.querySelector('em').textContent = '';
    if (t.stars[i] === 'none') return;
    steps.push(() => {
      el.classList.add('show');
      el.querySelector('em').textContent = t.stars[i] === 'old' ? 'already earned' : t.earns ? '+' + M.starButtons[i] : '';
      sfx('pinPop', 0);
    });
  });
  steps.push(() => {
    if (!t.earns) { noteEl.textContent = 'This road earns no Buttons: play the numbered levels on the map.'; return; }
    if (t.stars.includes('old')) noteEl.textContent = 'Grey stars were earned before and pay nothing again.';
    if (t.starButtons) tallyEl.appendChild(row('Stars', t.starButtons));
    tallyEl.appendChild(row('Score bonus', t.scoreButtons, '', t.scoreButtons < t.scoreBonus ? '(' + t.scoreBonus + '/' + M.scoreBonusCap + ', best already paid)' : '(' + t.scoreBonus + '/' + M.scoreBonusCap + ')'));
  });
  for (const a of t.achievements) steps.push(() => { tallyEl.appendChild(row('\u{1F3C6} ' + a.name, a.reward, 'ach')); sfx('pinPop', 0); });
  if (t.earns) steps.push(() => {
    totalEl.innerHTML = '<span class="bt"></span><span></span><small></small>';
    totalEl.children[1].textContent = '+' + t.total;
    totalEl.children[2].textContent = 'You have ' + Save.buttons;
  });
  const w = t.unlock && t.unlock.scissors && C.weapons[t.unlock.scissors];
  if (w || t.chest) steps.push(() => {
    unlockEl.hidden = false;
    if (w) {
      const img = document.createElement('img'), txt = document.createElement('span');
      img.src = w.svg; img.alt = ''; txt.textContent = 'New shears: ' + w.name + '!';
      unlockEl.append(img, txt);
      // shown here, so the map doesn't play the same weapon reveal again
      const k = Save.reveals.findIndex(r => r.scissors === t.unlock.scissors);
      if (k >= 0) { Save.reveals.splice(k, 1); persist(); }
    }
    if (t.chest) {
      const txt = document.createElement('span');
      txt.textContent = 'Every level of ' + M.worlds[t.chest].name + ' three-starred: its chest is ready on the map!';
      unlockEl.append(txt);
    }
    sfxSequence('waveClear');
  });
  timer = setTimeout(runStep, C.meta.tallyStepMs);
}

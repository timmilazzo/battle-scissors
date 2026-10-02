// The results card's Button tally (DOM only), played when a run ends (game.js endGame -> main.js). In order, one step
// every CONFIG.meta.tallyStepMs: the three stars animate in (gold = new, paying its Buttons; grey = already earned on
// an earlier run, pays nothing), then the Buttons by source (stars / score bonus / each achievement unlocked this run),
// then the total, then the unlock reveal (a new weapon, Shop stock this clear put on sale, a world chest ready), then
// the Shop line (the first deal the balance covers that the player hasn't seen, meta.js newDeals, with a Shop button
// main.js wires), then the buttons (CONTINUE...). A tap on the card skips to the end.
import { CONFIG as C } from './config.js';
import { view } from './core.js';
import { Save } from './save.js';
import { newDeals, earnsStars } from './meta.js';
import { dealText } from './armory.js';
import { sfx, sfxSequence } from './audio.js';

const card = document.querySelector('#over .card'), starEls = [...document.querySelectorAll('#res-stars .rs')];
const noteEl = document.getElementById('res-note'), tallyEl = document.getElementById('res-tally');
const totalEl = document.getElementById('res-total'), unlockEl = document.getElementById('res-unlock');
const shopEl = document.getElementById('res-shop'), shopTxt = shopEl.querySelector('span'), shopBtn = document.getElementById('res-shop-btn');
let steps = [], timer = 0;

function runStep() {
  timer = 0;
  const f = steps.shift();
  if (!f) { card.classList.remove('tallying'); return; }
  f();
  timer = setTimeout(runStep, C.meta.tallyStepMs);
}

// The Shop line: the first deal the balance covers that the player hasn't seen, and how many more. Re-run after the
// Shop closes over the card (the deal may be bought, or seen).
export function refreshResultsShop() {
  const ds = newDeals();
  shopEl.hidden = !ds.length;
  if (!ds.length) return;
  shopTxt.textContent = 'You can afford ' + dealText(ds[0]) + (ds.length > 1 ? ' and ' + (ds.length - 1) + ' more.' : '.');
  shopBtn.dataset.tab = ds[0].tab; shopBtn.dataset.screen = ds[0].screen;
  shopBtn.textContent = ds[0].screen === 'box' ? 'Sewing Box' : 'Shop';
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
  tallyEl.textContent = ''; totalEl.textContent = ''; noteEl.textContent = ''; unlockEl.hidden = true; unlockEl.textContent = ''; shopEl.hidden = true;
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
    if (!t.stars.some(s => s !== 'none') && t.wage && !t.scoreButtons) noteEl.textContent = 'A win here pays up to ' + t.scoreCap + ' Buttons for its score, every time.';
    else if (t.wage && t.earns && !earnsStars(view.levelId)) noteEl.textContent = 'Random Quilt pays the wage of a mid level; stars and trophies are earned on the map.';
    else if (t.stars.includes('old')) noteEl.textContent = 'Grey stars were earned before and pay nothing again. The score bonus pays every win.';
    if (t.starButtons) tallyEl.appendChild(row('Stars', t.starButtons));
    if (t.wage) tallyEl.appendChild(row('Score bonus', t.scoreButtons, '', '(' + t.scoreBonus + '/' + t.scoreCap + ')'));
  });
  for (const a of t.achievements) steps.push(() => { tallyEl.appendChild(row('\u{1F3C6} ' + a.name, a.reward, 'ach')); sfx('pinPop', 0); });
  if (t.earns) steps.push(() => {
    totalEl.innerHTML = '<span class="bt"></span><span></span><small></small>';
    totalEl.children[1].textContent = '+' + t.total;
    totalEl.children[2].textContent = 'You have ' + Save.buttons;
  });
  // What this win unlocked, as one line each; the cards themselves play on the map (TO THE MAP), where the next
  // step is in view: new scissors, Shop stock on sale, a Pin's tiers in the Sewing Box, a chest ready.
  const w = t.unlock && t.unlock.scissors && C.weapons[t.unlock.scissors];
  const stock = Save.reveals.filter(r => r.shop), boxes = Save.reveals.filter(r => r.box);
  if (w || t.chest || stock.length || boxes.length) steps.push(() => {
    unlockEl.hidden = false;
    const line = (text, img) => {
      const txt = document.createElement('span'); txt.textContent = text;
      if (img) { const im = document.createElement('img'); im.src = img; im.alt = ''; unlockEl.append(im); }
      unlockEl.append(txt);
    };
    if (w) line('New shears: ' + w.name + '! Waiting on the map.', w.svg);
    if (t.chest) line('Every level of ' + M.worlds[t.chest].name + ' three-starred: its chest is ready on the map!');
    for (const s of stock) { const sw = C.weapons[s.shop]; line(sw ? 'Now on sale in the Shop: ' + sw.name + '!' : 'New in the Sewing Box: SHRED tiers!'); }
    for (const b of boxes) if (C.towers[b.box]) line('New in the Sewing Box: ' + C.towers[b.box].name + ' tiers!');
    sfxSequence('waveClear');
  });
  steps.push(refreshResultsShop);
  timer = setTimeout(runStep, C.meta.tallyStepMs);
}

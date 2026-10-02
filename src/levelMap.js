// The level map screen (TITLE -> MAP -> SELECT): assets/level-map.webp drawn full height like the title plate (narrow
// screens crop its sides, wide ones get blurred side bars), with a button over each numbered patch (CONFIG.map.nodes).
// Cleared levels get a gold check and the next level to beat pulses; with CONFIG.map.locks, levels past that are
// locked (unless the save unlocked them: Save.unlocks.levels). Level 0 (the tutorial) has no patch in the art, so its
// button is a felt patch itself. Under the art: BACK (Random Quilt and Custom Road are off the map, on the title).
// Rewards won since the map was last open (Save.reveals: new scissors' card, Shop stock a clear put on sale, the
// credits, a world chest's contents) play over it, one tap each (revealNow plays one straight away elsewhere). Top left: the Buttons balance, Shop and Trophies (shop.js). A chest per world
// (CONFIG.meta.worlds) sits on the art: locked until every level of that world has three stars (a tap lists its
// fixed contents), then it glows; a tap opens it (meta.js openChest). DOM only.
import { CONFIG as C, VERSION } from './config.js';
import { clearedLevels } from './levelSelect.js';
import { levelInfo } from './levels/index.js';
import { Save, persist } from './save.js';
import { STORY } from './story.js';
import { PIN_ICON } from './actionBar.js';
import { pinTierText } from './armory.js';
import { sfxSequence } from './audio.js';
import { worldIds, worldLevels, chestState, openChest } from './meta.js';

const nodes = [], chests = [];
let toast = () => {}, onOpen = () => {}, onChange = () => {};

// onPick(id) when a level is chosen, onBack() for BACK, onOpen(screen, tab) for a reveal card's TO THE SHOP / TO THE
// SEWING BOX ('shop' | 'box'), onChange() after a chest paid out (the Buttons balance changed).
export function initLevelMap(opts) {
  toast = opts.toast; onOpen = opts.onOpen || onOpen; onChange = opts.onChange || onChange;
  const art = document.getElementById('map-art'), M = C.map;
  art.style.setProperty('--cw', M.w); art.style.setProperty('--ch', M.h);
  art.style.backgroundImage = 'url(' + M.img + ')';
  document.getElementById('map').style.setProperty('--plate', 'url(' + M.img + ')');
  M.nodes.forEach(([id, x, y], i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'map-node';
    b.style.setProperty('--x', x - M.hitW / 2); b.style.setProperty('--y', y - M.hitH / 2);
    b.style.setProperty('--w', M.hitW); b.style.setProperty('--h', M.hitH);
    b.innerHTML = '<span class="sr-only"></span><span class="check" aria-hidden="true">✓</span><span class="lock" aria-hidden="true"></span>' +
      '<span class="stars" aria-hidden="true"><i></i><i></i><i></i></span>';   // best stars (kit stars, index.html CSS)
    b.firstChild.textContent = 'Level ' + i + ': ' + (levelInfo(id) ? levelInfo(id).name : id);
    b.addEventListener('click', () => {
      if (b.classList.contains('locked')) { toast('Clear level ' + (i - 1) + ' first'); return; }
      opts.onPick(id);
    });
    art.appendChild(b); nodes.push(b);
  });
  for (const w of worldIds()) {
    const W = C.meta.worlds[w]; if (!W) continue;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'map-chest';
    b.style.setProperty('--x', W.x); b.style.setProperty('--y', W.y);
    b.innerHTML = '<span class="ch" aria-hidden="true"></span><span class="cap"></span>';
    const contents = C.meta.chestButtons + ' Buttons + ' + C.meta.cosmetics[W.chest].name;
    b.addEventListener('click', () => {
      const st = chestState(w);
      if (st === 'ready') { openChest(w); Save.reveals.push({ chest: w }); persist(); refreshLevelMap(); onChange(); }
      else if (st === 'opened') toast(W.name + ' chest: opened');
      else toast(W.name + ' chest: three-star all its levels for ' + contents);
    });
    art.appendChild(b); chests.push({ w, b, contents });
  }
  document.getElementById('map-back').addEventListener('click', () => opts.onBack());
  revealEl.addEventListener('click', e => {
    if (e.target.closest('[data-send-feedback]')) return;   // the credits' Send feedback: main.js handles it, the card stays
    Save.reveals.shift(); persist();
    if (revealLeft > 0 && --revealLeft === 0) revealEl.hidden = true; else showReveal();
  });
}

// Called each time the map opens: checks and best stars on cleared levels, a pulse on the next one, locks past it (if
// on).
export function refreshLevelMap() {
  const done = clearedLevels(), ids = C.map.nodes.map(n => n[0]);
  const next = ids.findIndex(id => !done.has(id));
  nodes.forEach((b, i) => {
    b.classList.toggle('cleared', done.has(ids[i]));
    const got = done.has(ids[i]) ? Math.min(3, (Save.levels[ids[i]] || {}).stars || 0) : 0;
    b.querySelectorAll('.stars i').forEach((s, k) => s.classList.toggle('on', k < got));
    b.classList.toggle('next', i === next);
    b.classList.toggle('locked', C.map.locks && next >= 0 && i > next && !Save.unlocks.levels.includes(ids[i]));
  });
  for (const { w, b, contents } of chests) {
    const st = chestState(w), lv = worldLevels(w), stars = lv.reduce((s, id) => s + Math.min(3, (Save.levels[id] || {}).stars || 0), 0);
    b.className = 'map-chest ' + w + ' ' + st;
    b.lastChild.textContent = st === 'opened' ? 'Opened' : st === 'ready' ? 'Open me!' : '★ ' + stars + '/' + lv.length * 3;
    b.setAttribute('aria-label', C.meta.worlds[w].name + ' chest (' + st + '): ' + contents);
  }
  document.getElementById('map-buttons').textContent = Save.buttons;
  showReveal();
}

// The first reward waiting in Save.reveals: new scissors (their own card: the art over spinning rays, the name, the
// story of why they turn up now, the blurb), a world chest's contents, or the credits. A tap dismisses it (and shows
// the next one, unless it was shown on its own by revealNow).
const revealEl = document.getElementById('reveal'), revealBody = document.getElementById('reveal-body');
let revealLeft = 0;          // revealNow: cards still to play before the card hides (0 = the map's queue plays on)
function showReveal() {
  const r = Save.reveals[0];
  revealEl.hidden = !r;
  if (!r) return;
  revealBody.textContent = '';
  const w = r.scissors && C.weapons[r.scissors], note = r.morning && STORY.morning[r.morning];
  if (note) {
    // the morning after a boss (story.js): where the note turned up, what the human wrote, what Tomato makes of it
    revealBody.innerHTML = '<div class="rv-kicker">THE MORNING AFTER</div><p class="rv-from"></p><div class="rv-note"></div>' +
      '<p class="rv-reply"><small></small><span></span></p><button class="felt-btn rv-ok" type="button">GOT IT</button>';
    revealBody.querySelector('.rv-from').textContent = note.from;
    const paper = revealBody.querySelector('.rv-note');
    paper.textContent = note.note; if (note.paper) paper.classList.add(note.paper);
    revealBody.querySelector('.rv-reply small').textContent = STORY.narrator.toUpperCase() + ' SAYS';
    revealBody.querySelector('.rv-reply span').textContent = note.reply;
  } else if (w) {
    revealBody.innerHTML = '<div class="rv-kicker">NEW SCISSORS!</div><img alt=""><div class="rv-name"></div><p class="rv-story"></p>' +
      '<p class="rv-blurb"></p><button class="felt-btn rv-ok" type="button">GOT IT</button>';
    revealBody.querySelector('img').src = w.svg;
    revealBody.querySelector('.rv-name').textContent = w.name;
    revealBody.querySelector('.rv-story').textContent = w.story || '';
    revealBody.querySelector('.rv-blurb').textContent = w.blurb;
  } else if (r.chest && C.meta.worlds[r.chest]) {
    const W = C.meta.worlds[r.chest], c = C.meta.cosmetics[W.chest];
    revealBody.innerHTML = '<div class="rv-credits"><h3></h3><p></p><p></p></div>';
    const [h, p1, p2] = revealBody.firstChild.children;
    h.textContent = W.name + ' chest!'; p1.textContent = '+' + C.meta.chestButtons + ' Buttons'; p2.textContent = c ? c.name + ' (wear it from the Shop)' : '';
  } else if ((r.shop && (r.shop === 'shred' || C.weapons[r.shop])) || (r.box && C.towers[r.box])) {
    // Stock a level clear put on sale (levelSelect.js): a pair in the Shop, or SHRED's / a Pin's tiers in the Sewing
    // Box. The big button opens that screen on that tab (the tap also closes the card, like any tap on it); LATER just
    // closes it.
    const w = r.shop && C.weapons[r.shop], pin = r.box && C.towers[r.box], t1 = C.shredTiers[1];
    revealBody.innerHTML = '<div class="rv-kicker"></div><img alt="" hidden><div class="rv-ico felt purple" hidden>✂</div><div class="rv-name"></div>' +
      '<p class="rv-story"></p><p class="rv-blurb"></p><div class="rv-row"><button class="felt-btn small" type="button">LATER</button>' +
      '<button class="felt-btn small rv-shop" type="button"></button></div>';
    const q = s => revealBody.querySelector(s);
    q('.rv-kicker').textContent = w ? 'NOW ON SALE' : 'NEW IN THE SEWING BOX';
    q('.rv-shop').textContent = w ? 'TO THE SHOP' : 'TO THE SEWING BOX';
    if (w) { q('img').hidden = false; q('img').src = w.svg; }
    else if (pin) { const ico = q('.rv-ico'); ico.hidden = false; ico.className = 'rv-ico felt pin'; ico.style.setProperty('--fc', pin.felt); ico.innerHTML = PIN_ICON[r.box] || ''; }
    else q('.rv-ico').hidden = false;
    q('.rv-name').textContent = w ? w.name : pin ? pin.name + ' tiers' : 'SHRED upgrades';
    q('.rv-story').textContent = w ? w.shop + ' Buttons, in the Shop.' :
      pin ? 'The ' + pin.name + ' can be made better for good: ' + [1, 2, 3].map(n => pinTierText(r.box, n)).join(', then ') + '.' :
      'SHRED can be upgraded now: ' + C.shredTiers.slice(1).map(t => t.name).join(', then ') + '.';
    q('.rv-blurb').textContent = w ? w.blurb : pin ? 'Tier 1: ' + pinTierText(r.box, 1) + ', ' + C.meta.pinTierCosts[0] + ' Buttons.' :
      t1.name + ': ' + (t1.turns === 2 ? 'two' : t1.turns) + ' spins before the snip, ' + C.meta.shredCosts[0] + ' Buttons.';
    q('.rv-shop').addEventListener('click', () => onOpen(w ? 'shop' : 'box', w ? 'pairs' : pin ? 'pins' : 'moves'));
  } else if (r.credits) {
    // The demo's end: say so plainly, then one more ask for feedback with a pointed question. The button is
    // data-send-feedback="demo" so main.js's delegated handler opens the draft with that question in the body.
    revealBody.innerHTML = '<div class="rv-credits"><h3>That&#39;s the demo!</h3><p>The Unstitcher is beaten and the quilt is safe.</p>' +
      '<p class="rv-demo">This is where the demo ends. Everything past here is still being sewn.</p>' +
      '<p class="rv-ask">One more favour: what was the <b>least fun</b> thing, and what should change?</p>' +
      '<button class="felt-btn rv-ok" type="button" data-send-feedback="demo">Send feedback</button>' +
      '<p>Battle Scissors<br>Made by Tim Milazzo · Built with Claude Code</p>' +
      '<small>Lilita One font (SIL OFL) · ZzFX sound by Frank Force (MIT) · mulberry32 (public domain)<br>v' + VERSION + '</small></div>';
  } else { Save.reveals.shift(); persist(); showReveal(); return; }   // nothing to show for this entry
  sfxSequence('waveClear');
}
// Show waiting rewards right now, away from the map (the results card's unlock step, a Shop purchase): every entry
// matching `match` goes to the front, in its queue order, and plays, one tap each; the last tap closes the card
// without playing the rest (the map does those).
export function revealNow(match) {
  const picked = Save.reveals.filter(match); if (!picked.length) return;
  Save.reveals = picked.concat(Save.reveals.filter(r => !match(r))); persist();
  revealLeft = picked.length; showReveal();
}

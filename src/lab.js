// The playtest workbench (dev only; loaded by main.js when the URL has ?lab=1): a drawer over the game for trying
// everything without playing up to it. It runs in a sandbox (save.js setSandbox: the save is read but never written) with
// every level, pair and Pin unlocked and a pile of Buttons, and holds game.js's `lab` switches: every tool allowed, the
// scheduled waves held, the heart unhurt, a stand-in map place for the hp / rank scaling. Sections: Road (a world's look
// + a recipe + seed to build and play a road on the fly, or any map level), Scissors (pair, upgrade tier, sharpen),
// Moves (SHRED tier, the Skill and its tier, charge both), Pins (permanent tiers, Thread), Enemies (spawn any type at a
// rank, in numbers; clear the board; hold waves; heart safe; heal). DOM only; nothing here is in the game's hot loop.
import { CONFIG as C } from './config.js';
import { Save, unlockAll } from './save.js';
import { state, lab, labSpawn, labCharge, labClear, labHeal, labSkill } from './game.js';
import { weapon } from './scissors.js';
import { ZONES } from './kit.js';
import { randomRecipe } from './levelGen.js';
import { levelInfo } from './levels/index.js';
import { mapIds, levelNo } from './meta.js';
import { view } from './core.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const row = (label, ...controls) => { const r = el('div', 'lab-row'); if (label) r.append(el('span', 'lab-l', label)); r.append(...controls); return r; };
const btn = (label, fn) => { const b = el('button', 'lab-b', label); b.type = 'button'; b.addEventListener('click', fn); return b; };
function select(options, value, onChange) {   // options: [value, label]
  const s = el('select', 'lab-s');
  for (const [v, l] of options) { const o = el('option', '', l); o.value = v; s.append(o); }
  s.value = String(value); s.addEventListener('change', () => onChange(s.value)); return s;
}
function check(label, get, set) {
  const l = el('label', 'lab-c'), c = el('input'); c.type = 'checkbox'; c.checked = get();
  c.addEventListener('change', () => set(c.checked)); l.append(c, ' ' + label); return l;
}
const num = (value, min, max, w) => { const i = el('input', 'lab-n'); i.type = 'number'; i.min = min; i.max = max; i.value = value; i.style.width = w || '4em'; return i; };
const tiers = (n, v, fn) => select([[0, 'tier 0'], ...Array.from({ length: n }, (_, i) => [i + 1, 'tier ' + (i + 1)])], v, x => fn(+x));

export function initLab(api) {
  lab.on = true;
  unlockAll({ levels: mapIds(), scissors: Object.keys(C.weapons), pins: Object.keys(C.towers) });
  Save.tutorialDone = true; Save.buttons += 5000;

  const panel = el('div', ''); panel.id = 'lab';
  panel.append(el('h3', '', 'Workbench'), el('p', 'lab-note', 'Sandbox: nothing here is saved. Every level, pair and Pin is open; the scheduled waves, the heart and the hp scaling have switches below.'));
  // keys typed here must not reach the game's shortcuts (E, F, P, R...)
  for (const t of ['keydown', 'keyup', 'keypress']) panel.addEventListener(t, e => e.stopPropagation());

  // --- Road ---
  panel.append(el('h4', '', 'Road'));
  let seed = 1 + Math.floor(Math.random() * 9999);
  const zone = select(Object.keys(ZONES).map(z => [z, z]), 'meadow', () => {});
  const recipe = el('input', 'lab-t'); recipe.type = 'text'; recipe.value = randomRecipe(seed);
  const seedIn = num(seed, 1, 999999, '6em');
  const fresh = () => { seed = 1 + Math.floor(Math.random() * 9999); seedIn.value = seed; recipe.value = randomRecipe(seed); };
  panel.append(row('look', zone, btn('New road', fresh)), row('recipe', recipe), row('seed', seedIn, btn('Play this road', () => { collapse(); api.playCustom(recipe.value, +seedIn.value || 1, zone.value); })));
  const levels = select(mapIds().concat('random').map(id => [id, (levelNo(id) ? levelNo(id) + ' ' : '') + (levelInfo(id) ? levelInfo(id).name : id)]), view.levelId, () => {});
  panel.append(row('level', levels, btn('Play level', () => { collapse(); api.playLevel(levels.value); })));

  // --- Scissors ---
  panel.append(el('h4', '', 'Scissors'));
  const pairs = Object.keys(C.weapons);
  let pairId = Save.equippedScissors && C.weapons[Save.equippedScissors] ? Save.equippedScissors : weapon.id;
  const tier = tiers(3, Save.upgrades[pairId] || 0, t => { Save.upgrades[pairId] = t; api.applyWeapon(pairId); });
  const pair = select(pairs.map(id => [id, C.weapons[id].name]), pairId, id => { pairId = id; Save.equippedScissors = id; tier.value = String(Save.upgrades[id] || 0); api.applyWeapon(id); });
  panel.append(row('pair', pair, tier), row('', btn('Sharpen to full', () => { Save.sharpness[pairId] = 1; api.applyWeapon(pairId); }), btn('Dull to 0', () => { Save.sharpness[pairId] = 0; api.applyWeapon(pairId); })));

  // --- Moves ---
  panel.append(el('h4', '', 'Moves'));
  const shredT = tiers(C.shredTiers.length - 1, Save.skills.shred || 0, t => { Save.skills.shred = t; });
  const skillIds = Object.keys(C.skills);
  const skillT = tiers(3, Save.skills[Save.equippedSkill] || 0, t => { if (Save.equippedSkill) { Save.skills[Save.equippedSkill] = t; labSkill(Save.equippedSkill); } });
  const skillSel = select([['', '(no Skill)'], ...skillIds.map(id => [id, C.skills[id].name])], Save.equippedSkill || '', id => { skillT.value = String(Save.skills[id] || 0); labSkill(id); });
  panel.append(row('SHRED', shredT), row('Skill', skillSel, skillT), row('', btn('Charge both', labCharge), el('span', 'lab-hint', 'the Skill switches at once (its badge sits under SHRED’s; tap it or press F); Charge both fills both meters')));

  // --- Pins ---
  panel.append(el('h4', '', 'Pins'));
  for (const type of Object.keys(C.towers)) panel.append(row(C.towers[type].name, tiers(3, Save.pinTiers[type] || 0, t => { Save.pinTiers[type] = t; })));
  panel.append(row('', btn('+500 Thread', () => { state.thread += 500; }), el('span', 'lab-hint', 'tiers apply to Pins built after the change')));

  // --- Enemies ---
  panel.append(el('h4', '', 'Enemies'));
  const types = Object.keys(C.enemyTypes).map(k => { const t = C.enemyTypes[k]; return [k, (t.name || k) + (t.boss ? (t.mini ? ' (mini boss)' : ' (boss)') : '')]; });
  const type = select(types, 'scrap', () => {}), rank = select([[1, 'rank 1'], [2, 'rank 2'], [3, 'rank 3']], 1, () => {}), count = num(1, 1, 30);
  panel.append(row('spawn', type, rank, count, btn('Go', () => labSpawn(type.value, +rank.value, +count.value || 1))));
  panel.append(row('', btn('Clear board', labClear), btn('Heal heart', labHeal)));
  panel.append(row('', check('hold the scheduled waves', () => lab.noWaves, v => { lab.noWaves = v; }), check('heart can’t fall', () => lab.godHeart, v => { lab.godHeart = v; })));
  const placeW = select([[0, 'as the level'], ...[1, 2, 3, 4, 5].map(w => [w, 'world ' + w])], 0, setPlace), placeN = select(Array.from({ length: 10 }, (_, i) => [i + 1, 'level ' + (i + 1)]), 5, setPlace);
  function setPlace() { lab.place = +placeW.value ? { world: +placeW.value, n: +placeN.value } : null; }
  panel.append(row('hp / ranks as', placeW, placeN), el('p', 'lab-hint', 'Spawns come one per the type’s gap, by the current entrance rule, at the rank picked (ranks only matter for regular types). A boss spawned here comes without its intro card.'));

  // --- the tab and the drawer ---
  const tab = btn('LAB', () => { panel.hidden = !panel.hidden; }); tab.id = 'lab-tab';
  const collapse = () => { panel.hidden = true; };
  document.body.append(panel, tab);
}

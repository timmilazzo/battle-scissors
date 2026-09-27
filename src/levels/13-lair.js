// Level 13 on the map. Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'lair', name: 'Ripper\u2019s Lair', blurb: 'The last stretch.',
  recipe: 's left, fork pin, zigzag 1', seed: 13,
  world: 'lair',
  allowedPins: null,         // Pin types that can be built here (null = all)
  startThread: null,         // thread at the start (null = CONFIG.startThread)
  waves: null,               // [[type, count, atSec], ...] per wave (null = CONFIG.waves)
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

// Level 13 on the map. Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'lair', name: 'Ripper\u2019s Lair', blurb: 'The last stretch.',
  recipe: 'spiral, entry left 45', seed: 13,
  world: 'lair',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 904 for all 128 enemies; its 4 silverfish (30 each) bring it back to
  // the old 1024 (8 per kill). tools/wavesheet.js prints the numbers.
  startThread: 8,            // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  waves: null,               // [[type, count, atSec], ...] per wave (null = CONFIG.waves)
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

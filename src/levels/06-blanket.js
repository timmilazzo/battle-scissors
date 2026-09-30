// Level 6 on the map. Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'blanket', name: 'Blanket Stitch', blurb: 'Three switchbacks.',
  recipe: 'size 1.2, start left, wave 3, zigzag 2, entry right 15', seed: 6,
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 12 to start = 516 for all 72 enemies; its 2 silverfish (30 each) bring it back to
  // the old 576 (8 per kill). tools/wavesheet.js prints the numbers.
  startThread: 12,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 2 },   // bonus critters this level (the cap; src/critters.js)
  // Everything so far, five waves.
  waves: [
    [['scrap', 6, 2], ['runner', 4, 8], ['bolster', 1, 14]],
    [['bolster', 2, 2], ['scrap', 7, 8], ['brute', 1, 16]],
    [['runner', 5, 2], ['scrap', 6, 8], ['bolster', 2, 14], ['runner', 4, 22]],
    [['scrap', 7, 2], ['brute', 1, 6], ['bolster', 2, 12], ['scrap', 6, 20]],
    [['runner', 6, 2], ['bolster', 3, 8], ['brute', 1, 16], ['scrap', 8, 24]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

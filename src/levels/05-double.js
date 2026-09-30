// Level 5 on the map. Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'double', name: 'Double Seam', blurb: 'A fork, then an S.',
  recipe: 'size 1.2, fork long, wave 3, entry right 20', seed: 25,
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 6 per kill + 26 to start = 284 for all 43 enemies; its 2 silverfish (30 each) bring it back to
  // the old 344 (8 per kill). tools/wavesheet.js prints the numbers.
  startThread: 26,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 6,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 2 },   // bonus critters this level (the cap; src/critters.js)
  // Introduces the Brute (large, armored). Four waves.
  waves: [
    [['scrap', 6, 2], ['bolster', 2, 10]],
    [['scrap', 6, 2], ['brute', 1, 10], ['scrap', 5, 18]],
    [['runner', 5, 2], ['bolster', 2, 8], ['brute', 1, 16]],
    [['scrap', 7, 2], ['brute', 1, 8], ['bolster', 2, 14], ['runner', 5, 22]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

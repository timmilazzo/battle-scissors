// Level 6 on the map. Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'blanket', name: 'Blanket Stitch', blurb: 'Three switchbacks.',
  recipe: 'start left, zigzag 3', seed: 6,
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  startThread: null,         // thread at the start (null = CONFIG.startThread)
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

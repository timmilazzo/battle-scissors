// Level 5 on the map. Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'double', name: 'Double Seam', blurb: 'A fork, then an S.',
  recipe: 'fork, s right', seed: 5,
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  startThread: null,         // thread at the start (null = CONFIG.startThread)
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

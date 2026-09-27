// Level 9 on the map. Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'cross', name: 'Crossroads', blurb: 'Two forks: four ways down.',
  recipe: 'fork wide, fork narrow', seed: 9,
  world: 'denim',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 12 to start = 726 for all 102 enemies; its 3 silverfish (30 each) bring it back to
  // the old 816 (8 per kill). tools/wavesheet.js prints the numbers.
  startThread: 12,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Remix: every regular enemy, in new mixes, on four roads. Six waves, no unlock.
  waves: [
    [['runner', 6, 2], ['scrap', 6, 8], ['bolster', 2, 14]],
    [['brute', 1, 2], ['scrap', 8, 6], ['runner', 5, 14]],
    [['bolster', 4, 2], ['runner', 6, 10], ['brute', 1, 18]],
    [['scrap', 10, 2], ['brute', 2, 8], ['runner', 6, 18]],
    [['bolster', 3, 2], ['brute', 1, 6], ['runner', 8, 12], ['scrap', 8, 20]],
    [['brute', 2, 2], ['bolster', 4, 8], ['runner', 8, 16], ['scrap', 10, 24], ['brute', 1, 32]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

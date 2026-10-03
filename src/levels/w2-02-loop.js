// World 2 (The Mending Pile), level 2 on its map (2-2). The Fire Pin, the world's Pin (pinFrom). Scrap Snippers go on
// sale after it.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'loop', name: 'Button Loop', blurb: 'A Pin pad inside the fork.',
  recipe: 'size 1.3, s left, fork pin, bend right, entry left 25', seed: 7,
  world: 'denim',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 8 per kill + 12 to start = 500 for all 61 enemies (5 pads); its 3 silverfish (30 each)
  // bring it to 590. tools/wavesheet.js prints the numbers.
  startThread: 12,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 8,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Five waves, heavier on Brutes.
  waves: [
    [['scrap', 7, 2], ['bolster', 2, 8]],
    [['brute', 1, 2], ['runner', 5, 8], ['scrap', 6, 14]],
    [['bolster', 3, 2], ['brute', 1, 10], ['scrap', 7, 16]],
    [['runner', 6, 2], ['brute', 2, 8], ['bolster', 2, 18]],
    [['scrap', 8, 2], ['bolster', 3, 8], ['brute', 1, 14], ['runner', 6, 22], ['brute', 1, 28]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

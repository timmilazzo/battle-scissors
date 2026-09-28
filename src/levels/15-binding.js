// Level 15 on the map, in the quilt's new border (World 4). Generated level: src/levelGen.js builds the road and pads
// from the recipe (grammar in its header; try it in tools/level-lab.html), src/levelArt.js paints the plate. Its map
// scale (bigger plate, smaller everything) comes from CONFIG.mapGrowth.
export default {
  id: 'binding', name: 'Binding', blurb: 'Switchbacks, a fork, a long wiggle.',
  recipe: 'zigzag 2, fork, wiggle 4', seed: 15,
  world: 'border',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 17 to start = 976 for all 137 enemies; its 4 silverfish (30 each) bring it back to
  // 1096 (8 per kill). tools/wavesheet.js prints the numbers.
  startThread: 17,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  waves: [
    [['scrap', 10, 2], ['bolster', 3, 8], ['runner', 6, 14]],
    [['runner', 8, 2], ['brute', 1, 8], ['scrap', 10, 14], ['bolster', 2, 22]],
    [['beetle', 2, 2], ['scrap', 10, 6], ['runner', 6, 14], ['bolster', 3, 20]],
    [['brute', 2, 2], ['scrap', 12, 8], ['beetle', 2, 16], ['runner', 6, 24]],
    [['scrap', 12, 2], ['bolster', 4, 8], ['brute', 2, 16], ['runner', 8, 22]],
    [['beetle', 3, 2], ['runner', 8, 8], ['scrap', 12, 14], ['brute', 2, 22], ['bolster', 3, 28]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

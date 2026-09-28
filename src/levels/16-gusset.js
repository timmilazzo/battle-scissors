// Level 16 on the map, in the quilt's new border (World 4). Generated level: src/levelGen.js builds the road and pads
// from the recipe (grammar in its header; try it in tools/level-lab.html), src/levelArt.js paints the plate. Its map
// scale (bigger plate, smaller everything) comes from CONFIG.mapGrowth.
export default {
  id: 'gusset', name: 'Gusset', blurb: 'A second road joins in: they come from two sides now.',
  recipe: 'merge right, fork, zigzag 2', seed: 16,
  world: 'border',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 26 to start = 1048 for all 146 enemies; its 4 silverfish (30 each) bring it back to
  // 1168 (8 per kill). tools/wavesheet.js prints the numbers.
  startThread: 26,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // The first level with two entry points: a side road comes in from the right and joins the main road, so enemies
  // arrive from two places (each picks one at random). No crossings yet (Level 17 brings those).
  waves: [
    [['scrap', 10, 2], ['runner', 6, 8], ['bolster', 3, 14]],
    [['scrap', 12, 2], ['bolster', 3, 8], ['brute', 1, 14], ['runner', 8, 20]],
    [['beetle', 2, 2], ['scrap', 12, 8], ['bolster', 3, 16], ['runner', 6, 22]],
    [['runner', 8, 2], ['brute', 2, 8], ['scrap', 12, 16], ['bolster', 3, 24]],
    [['scrap', 12, 2], ['beetle', 3, 8], ['runner', 8, 16], ['brute', 2, 24]],
    [['bolster', 4, 2], ['brute', 2, 8], ['scrap', 14, 14], ['beetle', 2, 22], ['runner', 8, 28]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

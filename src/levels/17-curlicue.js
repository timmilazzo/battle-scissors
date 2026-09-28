// Level 17 on the map, in the quilt's new border (World 4). Generated level: src/levelGen.js builds the road and pads
// from the recipe (grammar in its header; try it in tools/level-lab.html), src/levelArt.js paints the plate. Its map
// scale (bigger plate, smaller everything) comes from CONFIG.mapGrowth.
export default {
  id: 'curlicue', name: 'Curlicue', blurb: 'The road loops back over itself.',
  recipe: 'straight, curl left, fork, zigzag 1', seed: 17,
  world: 'border',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 33 to start = 1104 for all 153 enemies; its 4 silverfish (30 each) bring it back to
  // 1224 (8 per kill). tools/wavesheet.js prints the numbers.
  startThread: 33,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // The first crossing: the road curls round and runs back over itself, so enemies meet where it crosses (one
  // entry only; Level 16 had the two entries, Level 18 has both).
  waves: [
    [['scrap', 10, 2], ['bolster', 3, 8], ['runner', 8, 14]],
    [['runner', 8, 2], ['brute', 1, 8], ['scrap', 12, 14], ['bolster', 3, 22]],
    [['beetle', 2, 2], ['scrap', 12, 6], ['runner', 8, 14], ['bolster', 3, 20]],
    [['brute', 2, 2], ['scrap', 12, 8], ['beetle', 2, 16], ['runner', 8, 24]],
    [['scrap', 14, 2], ['bolster', 4, 8], ['brute', 2, 16], ['runner', 8, 22]],
    [['beetle', 3, 2], ['runner', 8, 8], ['scrap', 14, 14], ['brute', 2, 22], ['bolster', 4, 28]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

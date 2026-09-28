// Level 18 on the map, in the quilt's new border (World 4). Generated level: src/levelGen.js builds the road and pads
// from the recipe (grammar in its header; try it in tools/level-lab.html), src/levelArt.js paints the plate. Its map
// scale (bigger plate, smaller everything) comes from CONFIG.mapGrowth.
export default {
  id: 'tangle', name: 'The Tangle', blurb: 'Two entries, then the road crosses itself.',
  recipe: 'merge right, fork pin, curl left', seed: 18,
  world: 'border',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 47 to start = 1216 for all 167 enemies; its 4 silverfish (30 each) bring it back to
  // 1336 (8 per kill). tools/wavesheet.js prints the numbers.
  startThread: 47,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Both new road shapes together: a second entry from the right (the left edge is under the HUD) and a curl that crosses itself.
  waves: [
    [['scrap', 12, 2], ['runner', 8, 8], ['bolster', 3, 14]],
    [['scrap', 12, 2], ['bolster', 4, 8], ['brute', 2, 14], ['runner', 8, 20]],
    [['beetle', 3, 2], ['scrap', 12, 8], ['bolster', 3, 16], ['runner', 8, 22]],
    [['runner', 10, 2], ['brute', 2, 8], ['scrap', 14, 16], ['bolster', 4, 24]],
    [['scrap', 14, 2], ['beetle', 3, 8], ['runner', 8, 16], ['brute', 2, 24]],
    [['bolster', 5, 2], ['brute', 3, 8], ['scrap', 14, 14], ['beetle', 3, 22], ['runner', 10, 28]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

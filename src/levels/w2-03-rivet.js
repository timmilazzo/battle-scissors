// World 2 (The Mending Pile), level 3 on its map (2-3). A road twist: tight switchbacks, few pads.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'rivet', name: 'Rivet Row', blurb: 'Tight switchbacks down the denim.',
  recipe: 'size 1.2, wiggle 4, bend center, heart left', seed: 23,
  world: 'denim',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 435 for all 61 enemies (3 pads); its 3 silverfish (30 each)
  // bring it to 525. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Every regular enemy so far. Four waves.
  waves: [
    [['scrap', 7, 2], ['runner', 4, 8], ['bolster', 2, 14]],
    [['bolster', 3, 2], ['scrap', 6, 8], ['brute', 1, 16]],
    [['runner', 5, 2], ['brute', 1, 8], ['scrap', 7, 14], ['bolster', 2, 22]],
    [['scrap', 8, 2], ['bolster', 3, 8], ['runner', 5, 14], ['brute', 1, 22], ['scrap', 6, 28]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

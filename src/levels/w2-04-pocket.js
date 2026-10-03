// World 2 (The Mending Pile), level 4 on its map (2-4). Pressure: Runner packs, rank 2 everywhere.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'pocket', name: 'Back Pocket', blurb: 'Runners by the pack.',
  recipe: 'size 1.2, s, fork wide, entry left 20', seed: 24,
  world: 'denim',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 519 for all 73 enemies (4 pads); its 3 silverfish (30 each)
  // bring it to 609. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Big Runner packs between the slow ones. Four waves.
  waves: [
    [['runner', 6, 2], ['scrap', 6, 8], ['bolster', 2, 14]],
    [['runner', 8, 2], ['brute', 1, 10], ['runner', 6, 16]],
    [['scrap', 7, 2], ['runner', 8, 8], ['bolster', 3, 16]],
    [['runner', 8, 2], ['bolster', 3, 8], ['brute', 1, 14], ['runner', 8, 20], ['scrap', 6, 28]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

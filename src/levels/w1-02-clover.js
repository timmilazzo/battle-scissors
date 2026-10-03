// World 1 (The Sewing Tray), level 2 on its map (1-2). The Silverfish: the first critter crosses in wave 1's first lull (scripted). Split Enders go on sale after it.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'clover', name: 'Clover Fork', blurb: 'The road forks. Watch for silverfish.',
  recipe: 's left, fork pin', seed: 2,
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 8 per kill + 64 to start = 400 for all 42 enemies (4 pads); its 2 silverfish (30 each)
  // bring it to 460. tools/wavesheet.js prints the numbers.
  startThread: 64,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 8,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 2 },   // bonus critters this level (the cap; src/critters.js)
  critterIntro: true,        // the first silverfish is scripted: wave 1's first lull, no enemies about (counts toward the cap)
  // Still smalls and mediums, now split between two roads. Three waves.
  waves: [
    [['scrap', 5, 2], ['scrap', 5, 12], ['bolster', 1, 18]],
    [['scrap', 6, 2], ['bolster', 2, 8], ['scrap', 6, 16]],
    [['scrap', 6, 2], ['bolster', 2, 6], ['scrap', 7, 14], ['bolster', 2, 22]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, critters: true },   // each rule met on a win adds a star: 3rd = squish every silverfish
};

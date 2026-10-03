// World 3 (The Kitchen Drawer), level 2 on its map (3-2). The Cork Pin, the world's Pin (pinFrom); Runners again. Ratchet Pruners go on sale after it.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'corkscrew', name: 'Corkscrew', blurb: 'Round and round to the heart.',
  recipe: 'size 1.2, spiral right 1', seed: 32,
  world: 'autumn',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 8 per kill + 28 to start = 500 for all 59 enemies (5 pads); its 3 silverfish (30 each)
  // bring it to 590. tools/wavesheet.js prints the numbers.
  startThread: 28,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 8,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Leaves, Runners, Scraps and Bolsters. Four waves.
  waves: [
    [['leaf', 6, 2], ['runner', 3, 10], ['bolster', 1, 16]],
    [['scrap', 6, 2], ['bolster', 2, 8], ['leaf', 6, 16]],
    [['runner', 5, 2], ['leaf', 7, 8], ['bolster', 2, 16]],
    [['leaf', 7, 2], ['bolster', 3, 8], ['runner', 5, 14], ['scrap', 6, 22]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

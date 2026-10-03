// World 3 (The Kitchen Drawer), level 3 on its map (3-3). A road twist: the river and the ruler bridge (hand-placed dressing to come).
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'ruler', name: 'Ruler Bridge', blurb: 'Over the river on a ruler.',
  recipe: 'size 1.3, wave 2, s, entry left 25', seed: 36,
  world: 'autumn',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 38 to start = 500 for all 66 enemies (5 pads); its 3 silverfish (30 each)
  // bring it to 590. tools/wavesheet.js prints the numbers.
  startThread: 38,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Every enemy so far. Four waves.
  waves: [
    [['leaf', 7, 2], ['scrap', 5, 8], ['bolster', 2, 14]],
    [['runner', 5, 2], ['bolster', 2, 8], ['leaf', 7, 14]],
    [['scrap', 6, 2], ['leaf', 7, 8], ['bolster', 3, 16]],
    [['leaf', 8, 2], ['runner', 5, 8], ['bolster', 3, 14], ['scrap', 6, 22]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

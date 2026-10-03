// World 3 (The Kitchen Drawer), level 1 on its map (3-1). Arrival in the Kitchen Drawer: the gusts (world rule) and the Leaves, light and drifting.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'leafpile', name: 'Leaf Pile', blurb: 'Mind the wind.',
  recipe: 'size 1.2, s right, s left, entry right 20', seed: 31,
  world: 'autumn',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 8 per kill + 36 to start = 500 for all 58 enemies (5 pads); its 3 silverfish (30 each)
  // bring it to 590. tools/wavesheet.js prints the numbers.
  startThread: 36,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 8,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Leaves with Scraps and a few Bolsters. Four waves.
  waves: [
    [['leaf', 5, 2], ['scrap', 5, 10], ['bolster', 1, 16]],
    [['leaf', 6, 2], ['bolster', 2, 8], ['leaf', 5, 16]],
    [['scrap', 6, 2], ['leaf', 6, 8], ['bolster', 2, 16]],
    [['leaf', 7, 2], ['bolster', 2, 8], ['scrap', 5, 14], ['leaf', 6, 22]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

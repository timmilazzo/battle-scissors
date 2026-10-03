// World 3 (The Kitchen Drawer), level 7 on its map (3-7). Seam Mark, the world's Skill (skillFrom).
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'harvest', name: 'Harvest Row', blurb: 'Wiggles into a three-way split.',
  recipe: 'size 1.4, wiggle 4, triple, entry right 25', seed: 37,
  world: 'autumn',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 512 for all 72 enemies (5 pads); its 3 silverfish (30 each)
  // bring it to 602. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Every enemy of the drawer. Five waves.
  waves: [
    [['leaf', 7, 2], ['bolster', 2, 8], ['runner', 4, 14]],
    [['burr', 2, 2], ['scrap', 6, 8], ['leaf', 6, 14]],
    [['bolster', 3, 2], ['runner', 5, 8], ['burr', 2, 16]],
    [['leaf', 7, 2], ['brute', 1, 8], ['burr', 2, 14], ['scrap', 6, 20]],
    [['runner', 5, 2], ['burr', 3, 8], ['bolster', 2, 14], ['leaf', 8, 20], ['brute', 1, 28]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

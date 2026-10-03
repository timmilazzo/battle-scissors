// World 2 (The Mending Pile), level 10 on its map (2-10). Boss The Brute King; reward War Nippers; opens world 3.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'hemline', name: 'Hemline', blurb: 'An S into switchbacks.',
  recipe: 'size 1.3, wiggle 4, zigzag 3, bend center, entry right 20, heart left', seed: 8,
  world: 'denim',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 8 per kill + 100 to start = 588 for all 61 enemies (7 pads); its 3 silverfish (30 each)
  // bring it to 678. tools/wavesheet.js prints the numbers.
  startThread: 100,         // thread at the start (null = CONFIG.startThread)
  threadPerKill: 8,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Boss level: five waves, then the Brute King alone (timing and patience).
  waves: [
    [['scrap', 7, 2], ['bolster', 2, 8]],
    [['runner', 5, 2], ['brute', 1, 8], ['scrap', 6, 14]],
    [['bolster', 3, 2], ['scrap', 7, 8], ['brute', 1, 16]],
    [['brute', 2, 2], ['runner', 6, 10], ['bolster', 2, 18]],
    [['scrap', 8, 2], ['brute', 1, 8], ['bolster', 3, 14], ['runner', 6, 22]],
    [['bruteKing', 1, 0]],
  ],
  unlockOnClear: { scissors: 'nippers' },   // added to the save on the first win; the map shows the reveal
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

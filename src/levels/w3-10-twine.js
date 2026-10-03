// World 3 (The Kitchen Drawer), level 10 on its map (3-10). Boss The Twine Ball: charges like the Brute King and wraps up what it rolls over. Reward: Kitchen Shears.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'twine', name: 'The Twine Ball', blurb: 'It rolls. It wraps. It keeps what it catches.',
  recipe: 'size 1.4, wave 3, s, entry left 25', seed: 40,
  world: 'autumn',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 8 per kill + 32 to start = 600 for all 71 enemies (6 pads); its 3 silverfish (30 each)
  // bring it to 690. tools/wavesheet.js prints the numbers.
  startThread: 32,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 8,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Boss level: five waves, then the Twine Ball alone.
  waves: [
    [['leaf', 7, 2], ['scrap', 5, 8], ['bolster', 2, 14]],
    [['burr', 2, 2], ['runner', 5, 8], ['leaf', 6, 14]],
    [['bolster', 2, 2], ['leaf', 7, 8], ['burr', 2, 16]],
    [['runner', 5, 2], ['scrap', 6, 8], ['burr', 2, 14], ['brute', 1, 22]],
    [['leaf', 8, 2], ['burr', 3, 8], ['bolster', 2, 14], ['runner', 5, 22]],
    [['twine', 1, 0]],
  ],
  unlockOnClear: { scissors: 'kitchen' },   // added to the save on the first win; the map shows the reveal
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

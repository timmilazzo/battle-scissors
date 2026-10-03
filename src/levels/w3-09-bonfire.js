// World 3 (The Kitchen Drawer), level 9 on its map (3-9). The gauntlet: every enemy of world 3, the most waves before the boss.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'bonfire', name: 'Bonfire', blurb: 'Everything the drawer has, five waves of it.',
  recipe: 'size 1.4, s, triple, entry left 15, entry right 15', seed: 40,
  world: 'autumn',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 659 for all 93 enemies (5 pads); its 3 silverfish (30 each)
  // bring it to 749. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Leaves, Burrs, Runners, Bolsters, Scraps and Brutes. Five waves.
  waves: [
    [['leaf', 8, 2], ['runner', 4, 8], ['bolster', 2, 14]],
    [['burr', 2, 2], ['scrap', 7, 8], ['leaf', 7, 14], ['bolster', 1, 22]],
    [['runner', 6, 2], ['burr', 2, 8], ['brute', 1, 14], ['leaf', 7, 20]],
    [['bolster', 3, 2], ['leaf', 8, 8], ['burr', 3, 14], ['scrap', 6, 22]],
    [['leaf', 8, 2], ['burr', 3, 8], ['brute', 1, 14], ['runner', 6, 20], ['bolster', 2, 26], ['scrap', 6, 32]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

// World 4 (The Bedside Drawer), level 9 on its map (4-9). The gauntlet: every enemy of world 4, the most waves before the boss.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'moonlight', name: 'Moonlight', blurb: 'Everything the drawer has, five waves of it.',
  recipe: 'size 1.5, zigzag 3, triple, entry left 15, entry right 35', seed: 49,
  world: 'night',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 596 for all 84 enemies (5 pads); its 4 silverfish (30 each)
  // bring it to 716. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Moths, Beetles, Runners, Bolsters, Scraps and Brutes. Five waves.
  waves: [
    [['moth', 6, 2], ['scrap', 6, 8], ['bolster', 2, 14]],
    [['beetle', 2, 2], ['runner', 5, 8], ['moth', 5, 14]],
    [['bolster', 3, 2], ['moth', 6, 8], ['brute', 1, 14], ['scrap', 6, 20]],
    [['moth', 6, 2], ['beetle', 2, 8], ['runner', 6, 14], ['bolster', 2, 22]],
    [['moth', 7, 2], ['beetle', 3, 8], ['scrap', 7, 14], ['brute', 1, 20], ['runner', 6, 26], ['bolster', 2, 32]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

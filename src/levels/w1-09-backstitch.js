// World 1 (The Sewing Tray), level 9 on its map (1-9). The gauntlet: every enemy of world 1, the most waves before the boss.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'backstitch', name: 'Backstitch', blurb: 'Everything the tray has, five waves of it.',
  recipe: 'size 1.2, s, fork pin, zigzag 2, entry right 20', seed: 10,
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 6 per kill + 100 to start = 592 for all 82 enemies (5 pads); its 2 silverfish (30 each)
  // bring it to 652. tools/wavesheet.js prints the numbers.
  startThread: 100,         // thread at the start (null = CONFIG.startThread)
  threadPerKill: 6,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 2 },   // bonus critters this level (the cap; src/critters.js)
  // Scraps, Bolsters, Runners and Brutes. Five waves.
  waves: [
    [['scrap', 7, 2], ['runner', 4, 8], ['bolster', 2, 14]],
    [['bolster', 3, 2], ['scrap', 7, 8], ['brute', 1, 16]],
    [['runner', 6, 2], ['brute', 1, 8], ['scrap', 7, 14], ['bolster', 2, 22]],
    [['scrap', 8, 2], ['bolster', 3, 8], ['brute', 1, 14], ['runner', 5, 20]],
    [['runner', 6, 2], ['brute', 2, 8], ['bolster', 3, 14], ['scrap', 9, 22], ['runner', 5, 30]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

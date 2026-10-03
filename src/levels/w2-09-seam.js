// World 2 (The Mending Pile), level 9 on its map (2-9). The gauntlet: every enemy of world 2, the most waves before the boss.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'seam', name: 'Flat Seam', blurb: 'Switchbacks, a three-way split, three ways in.',
  recipe: 'size 1.4, zigzag 2, triple, entry right 30, entry left 50', seed: 29,
  world: 'denim',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 694 for all 98 enemies (6 pads); its 3 silverfish (30 each)
  // bring it to 784. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Everything, from three entrances. Five waves.
  waves: [
    [['scrap', 8, 2], ['runner', 5, 8], ['bolster', 2, 14]],
    [['bolster', 3, 2], ['brute', 1, 8], ['scrap', 8, 14], ['runner', 4, 22]],
    [['runner', 6, 2], ['scrap', 8, 8], ['brute', 1, 14], ['bolster', 3, 20]],
    [['brute', 2, 2], ['runner', 6, 10], ['bolster', 3, 16], ['scrap', 8, 24]],
    [['scrap', 8, 2], ['bolster', 4, 8], ['brute', 2, 14], ['runner', 8, 20], ['scrap', 8, 28]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

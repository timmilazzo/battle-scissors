// World 2 (The Mending Pile), level 7 on its map (2-7). Thimble Guard, the world's Skill (skillFrom).
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'patchwork', name: 'Patchwork', blurb: 'Three ways round, then a Pin fork.',
  recipe: 'size 1.3, triple, fork pin, entry left 30', seed: 27,
  world: 'denim',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 554 for all 78 enemies (4 pads); its 3 silverfish (30 each)
  // bring it to 644. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Every regular enemy. Five waves.
  waves: [
    [['scrap', 7, 2], ['bolster', 2, 8], ['runner', 5, 14]],
    [['brute', 1, 2], ['scrap', 7, 8], ['runner', 5, 14]],
    [['bolster', 3, 2], ['runner', 6, 8], ['brute', 1, 16]],
    [['scrap', 8, 2], ['brute', 1, 8], ['bolster', 3, 14], ['runner', 5, 20]],
    [['runner', 6, 2], ['bolster', 3, 8], ['brute', 2, 14], ['scrap', 8, 22], ['runner', 5, 30]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

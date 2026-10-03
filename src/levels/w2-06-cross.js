// World 2 (The Mending Pile), level 6 on its map (2-6). The Magnet Pin (pinFrom): four roads to herd.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'cross', name: 'Crossroads', blurb: 'Two forks: four ways down.',
  recipe: 'size 1.3, triple, fork narrow, entry left 30', seed: 9,
  world: 'denim',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 547 for all 77 enemies (3 pads); its 3 silverfish (30 each)
  // bring it to 637. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Every regular enemy, in new mixes, on four roads. Five waves.
  waves: [
    [['runner', 6, 2], ['scrap', 6, 8], ['bolster', 2, 14]],
    [['brute', 1, 2], ['scrap', 8, 6], ['runner', 5, 14]],
    [['bolster', 4, 2], ['runner', 6, 10], ['brute', 1, 18]],
    [['scrap', 10, 2], ['brute', 2, 8], ['runner', 6, 18]],
    [['bolster', 3, 2], ['brute', 1, 6], ['runner', 8, 12], ['scrap', 8, 20]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

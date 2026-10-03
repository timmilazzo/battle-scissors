// World 2 (The Mending Pile), level 8 on its map (2-8). Two entrances: a side road joins the main one.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'bias', name: 'Bias Tape', blurb: 'Waves into a Pin fork.',
  recipe: 'size 1.4, start right, s, triple, entry left 25, heart left', seed: 10,
  world: 'denim',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 596 for all 84 enemies (5 pads); its 3 silverfish (30 each)
  // bring it to 686. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Bolsters and Runners, slow and tough mixed with small and fast, a Brute now and then. Five waves.
  waves: [
    [['bolster', 2, 2], ['runner', 5, 6], ['scrap', 6, 12]],
    [['runner', 6, 2], ['bolster', 3, 8], ['brute', 1, 16]],
    [['bolster', 3, 2], ['runner', 5, 6], ['scrap', 7, 12], ['runner', 4, 20]],
    [['runner', 8, 2], ['brute', 1, 8], ['bolster', 3, 14], ['runner', 5, 22]],
    [['bolster', 4, 2], ['runner', 6, 6], ['brute', 1, 12], ['runner', 6, 18], ['scrap', 8, 26]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

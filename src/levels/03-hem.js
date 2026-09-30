// Level 3 on the map. Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'hem', name: 'Zigzag Hem', blurb: 'Switchbacks, then a fork.',
  recipe: 'size 1.15, zigzag 2, fork pin, entry left 30', seed: 3,
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 6 per kill + 40 to start = 340 for all 50 enemies; its 2 silverfish (30 each) bring it back to
  // the old 400 (8 per kill). tools/wavesheet.js prints the numbers.
  startThread: 40,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 6,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 2 },   // bonus critters this level (the cap; src/critters.js)
  // Introduces the Runner (small and fast). Four waves.
  waves: [
    [['scrap', 5, 2], ['runner', 3, 10]],
    [['scrap', 6, 2], ['bolster', 1, 8], ['runner', 4, 14]],
    [['runner', 4, 2], ['bolster', 2, 8], ['scrap', 6, 14]],
    [['scrap', 6, 2], ['runner', 5, 8], ['bolster', 2, 16], ['scrap', 6, 24]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

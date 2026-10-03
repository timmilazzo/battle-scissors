// World 4 (The Bedside Drawer), level 6 on its map (4-6). The Cigar Cutter in play: Button Beetles everywhere, a Brute or two.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'pencil', name: 'Pencil Stub', blurb: 'Beetles everywhere.',
  recipe: 'size 1.4, fork pin, wiggle 3, entry left 45', seed: 46,
  world: 'night',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 442 for all 62 enemies (4 pads); its 4 silverfish (30 each)
  // bring it to 562. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Beetle-heavy, Moths between. Five waves.
  waves: [
    [['beetle', 1, 2], ['moth', 5, 8], ['scrap', 5, 14]],
    [['beetle', 2, 2], ['runner', 5, 10], ['moth', 4, 16]],
    [['moth', 5, 2], ['beetle', 2, 8], ['brute', 1, 16]],
    [['beetle', 2, 2], ['scrap', 6, 8], ['moth', 5, 14], ['bolster', 2, 22]],
    [['beetle', 3, 2], ['moth', 6, 8], ['runner', 5, 14], ['brute', 1, 20], ['beetle', 2, 28]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

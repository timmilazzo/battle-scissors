// World 5 (The Holiday Box), level 7 on its map (5-7). Basting Stitch, the world's Skill (skillFrom).
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'tinsel', name: 'Tinsel', blurb: 'Wiggles into a three-way split.',
  recipe: 'size 1.5, wiggle 5, triple, entry left 25', seed: 57,
  world: 'snow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 554 for all 78 enemies (5 pads); its 4 silverfish (30 each)
  // bring it to 674. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Every enemy of the box. Five waves.
  waves: [
    [['scrap', 7, 2], ['snowball', 3, 8], ['icicle', 4, 14]],
    [['bolster', 2, 2], ['runner', 5, 8], ['snowball', 4, 14]],
    [['icicle', 6, 2], ['brute', 1, 8], ['scrap', 6, 14], ['snowball', 3, 20]],
    [['snowball', 4, 2], ['bolster', 2, 8], ['icicle', 5, 14], ['runner', 5, 20]],
    [['icicle', 6, 2], ['snowball', 4, 8], ['brute', 2, 14], ['bolster', 2, 20], ['scrap', 7, 26]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

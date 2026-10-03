// World 5 (The Holiday Box), level 4 on its map (5-4). Icicles: fast as a Runner, the Ice Pin does nothing to them, fire and the Candle double.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'icicle', name: 'Icicle Row', blurb: 'Icicles: fast, and Ice won\'t touch them.',
  recipe: 'size 1.4, s, zigzag 3, entry left 25', seed: 54,
  world: 'snow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 8 per kill + 100 to start = 588 for all 61 enemies (7 pads); its 4 silverfish (30 each)
  // bring it to 708. tools/wavesheet.js prints the numbers.
  startThread: 100,         // thread at the start (null = CONFIG.startThread)
  threadPerKill: 8,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Icicles among the Snowballs. Four waves.
  waves: [
    [['icicle', 4, 2], ['scrap', 6, 8], ['snowball', 3, 14]],
    [['snowball', 3, 2], ['icicle', 5, 8], ['bolster', 2, 16]],
    [['brute', 1, 2], ['icicle', 6, 8], ['scrap', 6, 14], ['snowball', 3, 20]],
    [['icicle', 6, 2], ['snowball', 4, 8], ['bolster', 2, 14], ['runner', 5, 20], ['icicle', 5, 26]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

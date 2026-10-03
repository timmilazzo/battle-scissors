// World 5 (The Holiday Box), level 5 on its map (5-5). Mini boss The Snow Globe: every shake snows the Pins under for a moment, and only then do snips on it land. Clearing it puts the Candle Pin's tiers on sale.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'snowglobe', name: 'The Snow Globe', blurb: 'When it shakes, the Pins go under.',
  recipe: 'size 1.4, s, fork long, entry right 30', seed: 55,
  world: 'snow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 24 to start = 500 for all 68 enemies (5 pads); its 4 silverfish (30 each)
  // bring it to 620. tools/wavesheet.js prints the numbers.
  startThread: 24,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Five waves; the Snow Globe comes in the third with the wave still coming.
  waves: [
    [['snowball', 4, 2], ['scrap', 6, 8], ['icicle', 4, 14]],
    [['brute', 1, 2], ['runner', 5, 8], ['snowball', 3, 14]],
    [['icicle', 5, 2], ['snowglobe', 1, 8], ['scrap', 6, 16], ['bolster', 2, 24]],
    [['snowball', 4, 2], ['icicle', 5, 8], ['brute', 1, 14], ['bolster', 2, 20]],
    [['icicle', 6, 2], ['snowball', 4, 8], ['bolster', 2, 14], ['brute', 1, 20], ['scrap', 6, 26]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

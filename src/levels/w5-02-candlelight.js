// World 5 (The Holiday Box), level 2 on its map (5-2). The Candle Pin, the world's Pin (pinFrom). Ribbon Shears go on sale after it.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'candlelight', name: 'Candlelight', blurb: 'Waves into a Pin fork.',
  recipe: 'size 1.3, wave 3, fork pin, entry left 25', seed: 52,
  world: 'snow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 8 per kill + 76 to start = 500 for all 53 enemies (5 pads); its 4 silverfish (30 each)
  // bring it to 620. tools/wavesheet.js prints the numbers.
  startThread: 76,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 8,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Snowballs, Scraps, Bolsters and Brutes. Four waves.
  waves: [
    [['snowball', 4, 2], ['scrap', 6, 8], ['bolster', 1, 14]],
    [['brute', 1, 2], ['snowball', 4, 8], ['scrap', 6, 14]],
    [['bolster', 2, 2], ['snowball', 4, 8], ['scrap', 6, 14], ['brute', 1, 22]],
    [['snowball', 5, 2], ['bolster', 2, 8], ['brute', 1, 14], ['scrap', 7, 20], ['snowball', 3, 26]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

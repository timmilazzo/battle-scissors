// World 5 (The Holiday Box), level 1 on its map (5-1). Arrival in the Holiday Box: the cold (world rule: weaker Ice, longer burns, two-clang Brutes) and the Snowballs, which grow as they roll.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'firstsnow', name: 'First Snow', blurb: 'Kill the snowballs before they grow.',
  recipe: 'size 1.3, s left, s right, entry left 15', seed: 51,
  world: 'snow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 8 per kill + 100 to start = 484 for all 48 enemies (5 pads); its 4 silverfish (30 each)
  // bring it to 604. tools/wavesheet.js prints the numbers.
  startThread: 100,         // thread at the start (null = CONFIG.startThread)
  threadPerKill: 8,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Snowballs with Scraps, Bolsters and a Brute or two. Four waves.
  waves: [
    [['snowball', 3, 2], ['scrap', 6, 8], ['bolster', 1, 16]],
    [['scrap', 6, 2], ['snowball', 3, 8], ['brute', 1, 16]],
    [['snowball', 4, 2], ['bolster', 2, 10], ['scrap', 6, 16]],
    [['snowball', 4, 2], ['brute', 1, 8], ['scrap', 6, 14], ['bolster', 2, 20], ['snowball', 3, 26]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

// World 5 (The Holiday Box), level 9 on its map (5-9). The gauntlet: every enemy of world 5, six waves, the most in the game.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'blizzard', name: 'Blizzard', blurb: 'Everything the box has, six waves of it.',
  recipe: 'size 1.5, triple, zigzag 2, entry left 35, entry right 35', seed: 59,
  world: 'snow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 743 for all 105 enemies (6 pads); its 4 silverfish (30 each)
  // bring it to 863. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Snowballs, Icicles, Runners, Bolsters, Scraps and Brutes. Six waves.
  waves: [
    [['snowball', 4, 2], ['scrap', 7, 8], ['icicle', 4, 14]],
    [['bolster', 2, 2], ['runner', 5, 8], ['brute', 1, 14]],
    [['icicle', 6, 2], ['snowball', 4, 8], ['scrap', 6, 14], ['bolster', 2, 22]],
    [['brute', 1, 2], ['icicle', 5, 8], ['snowball', 4, 14], ['runner', 5, 20]],
    [['snowball', 5, 2], ['bolster', 3, 8], ['icicle', 6, 14], ['brute', 1, 20], ['scrap', 6, 26]],
    [['icicle', 6, 2], ['snowball', 5, 8], ['brute', 2, 14], ['runner', 6, 20], ['bolster', 2, 26], ['scrap', 7, 32]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

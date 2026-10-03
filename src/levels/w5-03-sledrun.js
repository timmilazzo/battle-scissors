// World 5 (The Holiday Box), level 3 on its map (5-3). A road twist: a long straight slide; Runners again.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'sledrun', name: 'The Sled Run', blurb: 'A long straight run. They come fast.',
  recipe: 'size 1.4, straight, straight, s, entry right 20', seed: 53,
  world: 'snow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 414 for all 58 enemies (4 pads); its 4 silverfish (30 each)
  // bring it to 534. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Runner-heavy, with Snowballs. Four waves.
  waves: [
    [['runner', 5, 2], ['snowball', 3, 8], ['scrap', 5, 14]],
    [['snowball', 4, 2], ['runner', 5, 8], ['bolster', 2, 14]],
    [['scrap', 6, 2], ['brute', 1, 8], ['runner', 6, 14], ['snowball', 3, 20]],
    [['runner', 6, 2], ['snowball', 4, 8], ['bolster', 2, 14], ['brute', 1, 20], ['runner', 5, 26]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

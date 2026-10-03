// World 1 (The Sewing Tray), level 8 on its map (1-8). Two side entrances: enemies come in from the left and right edges as well as the top.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'gather', name: 'Gathering', blurb: 'Two side roads gather into one.',
  recipe: 's, fork long, entry left 20, entry right 40', seed: 14,
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 6 per kill + 74 to start = 476 for all 67 enemies (4 pads); its 2 silverfish (30 each)
  // bring it to 536. tools/wavesheet.js prints the numbers.
  startThread: 74,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 6,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 2 },   // bonus critters this level (the cap; src/critters.js)
  // Everything so far, from three ways in. Four waves.
  waves: [
    [['scrap', 7, 2], ['runner', 4, 8], ['bolster', 2, 14]],
    [['bolster', 2, 2], ['brute', 1, 10], ['scrap', 7, 14], ['runner', 4, 22]],
    [['runner', 5, 2], ['scrap', 6, 8], ['bolster', 3, 14], ['brute', 1, 22]],
    [['scrap', 8, 2], ['brute', 1, 6], ['runner', 6, 12], ['bolster', 3, 18], ['scrap', 7, 26]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

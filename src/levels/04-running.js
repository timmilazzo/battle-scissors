// Level 4 on the map. Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'running', name: 'Running Stitch', blurb: 'Gentle waves.',
  recipe: 'size 1.3, wave 3, s, entry right 20', seed: 4,
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 6 per kill + 52 to start = 388 for all 56 enemies; its 2 silverfish (30 each) bring it back to
  // the old 448 (8 per kill). tools/wavesheet.js prints the numbers.
  startThread: 52,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 6,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 2 },   // bonus critters this level (the cap; src/critters.js)
  // Boss level: five waves, then the Seam Ripper alone (timing).
  waves: [
    [['scrap', 5, 2], ['runner', 3, 10]],
    [['scrap', 6, 2], ['bolster', 2, 8]],
    [['runner', 4, 2], ['scrap', 6, 8], ['bolster', 1, 16]],
    [['scrap', 7, 2], ['bolster', 2, 8], ['runner', 4, 16]],
    [['bolster', 3, 2], ['runner', 5, 10], ['scrap', 7, 18]],
    [['seamRipper', 1, 0]],
  ],
  unlockOnClear: { scissors: 'dagger' },   // added to the save on the first win; the map shows the reveal
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

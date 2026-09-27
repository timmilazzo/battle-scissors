// Level 4 on the map. Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'running', name: 'Running Stitch', blurb: 'Gentle waves.',
  recipe: 'wave 3, s', seed: 4,
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  startThread: null,         // thread at the start (null = CONFIG.startThread)
  // Boss level: five waves, then the Seam Ripper alone (timing).
  waves: [
    [['scrap', 5, 2], ['runner', 3, 10]],
    [['scrap', 6, 2], ['bolster', 2, 8]],
    [['runner', 4, 2], ['scrap', 6, 8], ['bolster', 1, 16]],
    [['scrap', 7, 2], ['bolster', 2, 8], ['runner', 4, 16]],
    [['bolster', 3, 2], ['runner', 5, 10], ['scrap', 7, 18]],
    [['seamRipper', 1, 0]],
  ],
  unlockOnClear: { scissors: 'nippers' },   // added to the save on the first win; the map shows the reveal
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

// Level 12 on the map. Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'whip', name: 'Whipstitch', blurb: 'Wiggles into a wide fork.',
  recipe: 'wiggle 5, fork wide', seed: 12,
  world: 'lair',
  allowedPins: null,         // Pin types that can be built here (null = all)
  startThread: null,         // thread at the start (null = CONFIG.startThread)
  // Boss level: five waves, then The Unstitcher alone (it calls its own Scrap swarms). Clearing it rolls the credits.
  waves: [
    [['scrap', 8, 2], ['runner', 6, 8], ['bolster', 2, 14]],
    [['brute', 1, 2], ['bolster', 3, 8], ['runner', 6, 14]],
    [['scrap', 10, 2], ['brute', 2, 8], ['bolster', 2, 16]],
    [['runner', 8, 2], ['bolster', 4, 8], ['brute', 1, 16], ['scrap', 8, 22]],
    [['brute', 2, 2], ['runner', 8, 8], ['bolster', 4, 16], ['scrap', 10, 24]],
    [['unstitcher', 1, 0]],
  ],
  unlockOnClear: { credits: true },   // added to the save on the first win; the map shows the reveal
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

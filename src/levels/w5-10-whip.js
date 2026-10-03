// World 5 (The Holiday Box), level 10 on its map (5-10). Boss The Unstitcher; the credits. (Id kept from the old
// "Whipstitch": saves key on it.)
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'whip', name: 'The Back Seam', blurb: 'The back of the box. Something waits past the seam.',
  recipe: 'size 1.5, wiggle 5, fork wide, entry left 40, heart right', seed: 12,
  world: 'snow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 547 for all 77 enemies (5 pads); its 4 silverfish (30 each)
  // bring it to 667. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Boss level: five waves, then The Unstitcher alone (it calls its own Scrap swarms). Clearing it rolls the credits.
  waves: [
    [['scrap', 7, 2], ['snowball', 3, 8], ['icicle', 4, 14]],
    [['brute', 1, 2], ['bolster', 2, 8], ['runner', 5, 14]],
    [['snowball', 4, 2], ['icicle', 5, 8], ['brute', 1, 16], ['scrap', 6, 22]],
    [['runner', 6, 2], ['bolster', 2, 8], ['snowball', 4, 14], ['icicle', 5, 22]],
    [['brute', 2, 2], ['icicle', 6, 8], ['snowball', 4, 16], ['bolster', 2, 22], ['scrap', 7, 28]],
    [['unstitcher', 1, 0]],
  ],
  unlockOnClear: { credits: true },   // added to the save on the first win; the map shows the reveal
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

// World 5 (The Holiday Box), level 8 on its map (5-8). Two side entrances.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'cabin', name: 'Cabin Lights', blurb: 'Three ways in to the cabin.',
  recipe: 'size 1.5, fork wide, wave 3, entry left 30, entry right 50', seed: 58,
  world: 'snow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 582 for all 82 enemies (5 pads); its 4 silverfish (30 each)
  // bring it to 702. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Everything, from three entrances. Five waves.
  waves: [
    [['snowball', 4, 2], ['scrap', 6, 8], ['bolster', 2, 14]],
    [['icicle', 5, 2], ['brute', 1, 8], ['runner', 5, 14]],
    [['snowball', 4, 2], ['scrap', 6, 8], ['icicle', 5, 14], ['bolster', 2, 22]],
    [['brute', 1, 2], ['snowball', 4, 8], ['runner', 5, 14], ['icicle', 5, 20]],
    [['icicle', 6, 2], ['snowball', 5, 8], ['bolster', 2, 14], ['brute', 2, 20], ['scrap', 7, 26], ['runner', 5, 32]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

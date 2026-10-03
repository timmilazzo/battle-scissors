// World 3 (The Kitchen Drawer), level 8 on its map (3-8). Two side entrances.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'pumpkin', name: 'Pumpkin Patch', blurb: 'Three ways into the patch.',
  recipe: 'size 1.4, zigzag 2, fork wide, entry left 30, entry right 50', seed: 38,
  world: 'autumn',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 33 to start = 600 for all 81 enemies (6 pads); its 3 silverfish (30 each)
  // bring it to 690. tools/wavesheet.js prints the numbers.
  startThread: 33,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Everything, from three entrances. Five waves.
  waves: [
    [['leaf', 7, 2], ['scrap', 6, 8], ['burr', 1, 14]],
    [['runner', 5, 2], ['bolster', 2, 8], ['leaf', 7, 14]],
    [['burr', 2, 2], ['scrap', 6, 8], ['brute', 1, 14], ['leaf', 6, 20]],
    [['leaf', 7, 2], ['burr', 2, 8], ['runner', 5, 14], ['bolster', 2, 22]],
    [['scrap', 6, 2], ['burr', 3, 8], ['leaf', 7, 14], ['brute', 1, 20], ['runner', 5, 26]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

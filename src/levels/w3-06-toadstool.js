// World 3 (The Kitchen Drawer), level 6 on its map (3-6). The Ratchet Pruners in play: their jaw holds a Burr still for a second snip. The first Brutes in the drawer.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'toadstool', name: 'Toadstool Ring', blurb: 'A Pin fork into gentle waves.',
  recipe: 'size 1.3, fork pin, wave 3, entry left 20', seed: 36,
  world: 'autumn',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 24 to start = 500 for all 68 enemies (5 pads); its 3 silverfish (30 each)
  // bring it to 590. tools/wavesheet.js prints the numbers.
  startThread: 24,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Burr-heavy, a Brute or two. Five waves.
  waves: [
    [['leaf', 6, 2], ['burr', 2, 8], ['scrap', 5, 14]],
    [['burr', 2, 2], ['runner', 5, 8], ['bolster', 2, 14]],
    [['leaf', 7, 2], ['burr', 3, 8], ['brute', 1, 16]],
    [['scrap', 6, 2], ['burr', 2, 8], ['leaf', 7, 14], ['bolster', 2, 22]],
    [['burr', 3, 2], ['runner', 5, 8], ['brute', 1, 14], ['leaf', 7, 20], ['burr', 2, 28]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

// World 3 (The Kitchen Drawer), level 5 on its map (3-5). Mini boss The Honey Dipper: enemies that come near stick to it and shield it; kill it before it fills up. Clearing it puts the Cork Pin's tiers on sale.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'honeydipper', name: 'The Honey Dipper', blurb: 'Everything sticks to it.',
  recipe: 'size 1.3, s, fork long, entry right 30', seed: 35,
  world: 'autumn',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 519 for all 73 enemies (5 pads); its 3 silverfish (30 each)
  // bring it to 609. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Five waves; the Honey Dipper comes in the third with the wave still coming.
  waves: [
    [['leaf', 6, 2], ['scrap', 5, 8], ['bolster', 1, 14]],
    [['burr', 2, 2], ['runner', 4, 8], ['leaf', 6, 14]],
    [['scrap', 5, 2], ['honeydipper', 1, 8], ['leaf', 6, 16], ['bolster', 2, 24]],
    [['runner', 5, 2], ['burr', 2, 8], ['leaf', 6, 14], ['bolster', 1, 22]],
    [['leaf', 7, 2], ['burr', 2, 8], ['bolster', 2, 14], ['scrap', 6, 20], ['runner', 4, 28]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

// Level 3 on the map. Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'hem', name: 'Zigzag Hem', blurb: 'Switchbacks, then a fork.',
  recipe: 'zigzag 2, fork pin', seed: 3,
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  startThread: null,         // thread at the start (null = CONFIG.startThread)
  // Introduces the Runner (small and fast). Four waves.
  waves: [
    [['scrap', 5, 2], ['runner', 3, 10]],
    [['scrap', 6, 2], ['bolster', 1, 8], ['runner', 4, 14]],
    [['runner', 4, 2], ['bolster', 2, 8], ['scrap', 6, 14]],
    [['scrap', 6, 2], ['runner', 5, 8], ['bolster', 2, 16], ['scrap', 6, 24]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

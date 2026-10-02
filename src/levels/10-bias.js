// Level 10 on the map. Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'bias', name: 'Bias Tape', blurb: 'Waves into a Pin fork.',
  recipe: 'size 1.4, start right, s, triple, entry left 25, heart left', seed: 10,
  world: 'denim',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 6 per kill + 78 to start = 582 for all 84 enemies; its 3 silverfish (30 each) bring it back to
  // the old 672 (8 per kill). tools/wavesheet.js prints the numbers.
  startThread: 78,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Bolsters and Runners: slow and tough mixed with small and fast. Six waves; unlocks the Cigar Cutter.
  waves: [
    [['bolster', 2, 2], ['runner', 5, 6]],
    [['runner', 6, 2], ['bolster', 3, 8]],
    [['bolster', 3, 2], ['runner', 4, 6], ['runner', 4, 14]],
    [['runner', 8, 2], ['bolster', 4, 8], ['runner', 5, 20]],
    [['bolster', 5, 2], ['runner', 6, 6], ['runner', 6, 16]],
    [['runner', 8, 2], ['bolster', 4, 6], ['runner', 8, 14], ['bolster', 3, 22]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

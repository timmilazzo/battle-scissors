// World 5 (The Holiday Box), level 6 on its map (5-6). The Ribbon Shears in play (on sale after 5-2). (Id kept from the
// old "Ripper's Lair": saves key on it.)
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'lair', name: 'Frost Spiral', blurb: 'Round and round on the ice.',
  recipe: 'size 1.5, spiral, entry left 45', seed: 13,
  world: 'snow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 47 to start = 600 for all 79 enemies (6 pads); its 4 silverfish (30 each)
  // bring it to 720. tools/wavesheet.js prints the numbers.
  startThread: 47,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Every enemy of the box so far, round the spiral. Five waves.
  waves: [
    [['snowball', 4, 2], ['scrap', 7, 8], ['icicle', 4, 14]],
    [['bolster', 2, 2], ['runner', 5, 8], ['snowball', 3, 14], ['brute', 1, 20]],
    [['icicle', 6, 2], ['scrap', 6, 8], ['snowball', 4, 14], ['bolster', 2, 20]],
    [['brute', 1, 2], ['icicle', 5, 8], ['runner', 5, 14], ['snowball', 3, 20]],
    [['snowball', 5, 2], ['icicle', 6, 8], ['bolster', 2, 14], ['brute', 2, 20], ['scrap', 6, 26]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

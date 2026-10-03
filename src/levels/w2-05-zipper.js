// World 2 (The Mending Pile), level 5 on its map (2-5). Mini boss The Zipper: its head is shielded while any of its teeth (Scraps in a line behind it) lives. Clearing it puts the Fire Pin's tiers on sale.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'zipper', name: 'The Zipper', blurb: 'Cut the teeth, then the head.',
  recipe: 'size 1.3, s right, s left, entry right 25', seed: 25,
  world: 'denim',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 547 for all 77 enemies (5 pads); its 3 silverfish (30 each)
  // bring it to 637. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Five waves; the Zipper comes in the third with the wave still coming.
  waves: [
    [['scrap', 7, 2], ['runner', 4, 8], ['bolster', 2, 14]],
    [['bolster', 3, 2], ['brute', 1, 10], ['scrap', 6, 16]],
    [['scrap', 6, 2], ['zipper', 1, 8], ['runner', 5, 18], ['bolster', 2, 26]],
    [['runner', 6, 2], ['brute', 1, 8], ['scrap', 7, 14], ['bolster', 2, 22]],
    [['scrap', 8, 2], ['bolster', 3, 8], ['brute', 1, 14], ['runner', 6, 20], ['scrap', 6, 28]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

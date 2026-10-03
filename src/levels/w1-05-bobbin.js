// World 1 (The Sewing Tray), level 5 on its map (1-5). Mini boss The Bobbin: it comes in wave 3 with the wave still coming, dropping Scraps behind it until it falls. Clearing it puts SHRED's tiers on sale.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'bobbin', name: 'The Bobbin', blurb: 'A runaway bobbin, unspooling Scraps.',
  recipe: 's, s, entry right 30', seed: 5,
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 15 to start = 400 for all 55 enemies (4 pads); its 2 silverfish (30 each)
  // bring it to 460. tools/wavesheet.js prints the numbers.
  startThread: 15,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 2 },   // bonus critters this level (the cap; src/critters.js)
  // Four waves; the Bobbin walks on in the third and the regular spawns keep coming after it.
  waves: [
    [['scrap', 6, 2], ['runner', 3, 10], ['bolster', 1, 16]],
    [['bolster', 2, 2], ['scrap', 6, 8], ['runner', 4, 16]],
    [['scrap', 5, 2], ['bobbin', 1, 8], ['runner', 4, 16], ['bolster', 2, 24]],
    [['runner', 5, 2], ['scrap', 7, 8], ['bolster', 3, 14], ['scrap', 6, 22]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

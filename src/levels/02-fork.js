// Level 2 on the map. The painted denim quilt: the road forks around the big button and joins again above the heart
// pad; each enemy takes a side at random (the run's seeded spawn stream).
// Painted level: the plate art is assets/level2-bg.webp (941x1672); everything below is in its pixels. If the art changes,
// re-measure the road and pads.
export default {
  id: 'fork', name: 'Button Fork', blurb: 'The road forks. Enemies pick a side.',
  bg: 'assets/level2-bg.webp', w: 941, h: 1672,
  // road centrelines (Catmull-Rom control points), each walked first -> last point (the heart pad)
  paths: [
    [
      [474, -90], [474, 60], [474, 250], [474, 420], [400, 500], [290, 560], [195, 650], [155, 770],
      [165, 880], [235, 965], [350, 1030], [445, 1075], [474, 1130], [474, 1250], [474, 1380], [474, 1480],
    ],
    [
      [474, -90], [474, 60], [474, 250], [474, 420], [548, 500], [658, 560], [753, 650], [793, 770],
      [783, 880], [713, 965], [598, 1030], [503, 1075], [474, 1130], [474, 1250], [474, 1380], [474, 1480],
    ],
  ],
  spots: [[190, 462], [762, 462], [262, 1195], [686, 1195]],   // the four round stitched pads
  spotR: 84,                 // pad radius
  roadHalfWidth: 45,         // the fork's arms are a little narrower than the Meadow road
  workshopR: 112,            // heart pad radius
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  startThread: null,         // thread at the start (null = CONFIG.startThread)
  // Still smalls and mediums, now split between two roads. Three waves.
  waves: [
    [['scrap', 5, 2], ['scrap', 5, 12], ['bolster', 1, 18]],
    [['scrap', 6, 2], ['bolster', 2, 8], ['scrap', 6, 16]],
    [['scrap', 6, 2], ['bolster', 2, 6], ['scrap', 7, 14], ['bolster', 2, 22]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

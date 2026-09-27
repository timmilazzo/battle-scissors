// Random Quilt (a button on the level map, not a numbered patch): a new generated road every run, drawn from the run's
// seed (so ?seed= replays it). See src/levelGen.js randomRecipe().
export default {
  id: 'random', name: 'Random Quilt', blurb: 'A new road every run.',
  random: true,
  world: 'denim',
  allowedPins: null,         // Pin types that can be built here (null = all)
  startThread: null,         // thread at the start (null = CONFIG.startThread)
  waves: null,               // [[type, count, atSec], ...] per wave (null = CONFIG.waves)
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};

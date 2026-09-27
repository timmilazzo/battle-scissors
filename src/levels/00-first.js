// Level 0 on the map: the no-text tutorial for Hold (easy) controls. A ghost hand shows each step; there is no Pin,
// thread, SHRED or wave badge, and the player can't lose (a Scrap that reaches the heart just goes back to the top).
// The steps themselves are scripted in game.js (tutorial section), not driven by `waves`.
// Generated level: one straight road down the middle, no Pin pads.
export default {
  id: 'first', name: 'First Snip', blurb: 'Hold, let go, snip.',
  recipe: 'straight', seed: 1, pads: 0,
  weapon: 'safety',          // always played with these (whatever is equipped)
  world: 'meadow',
  allowedPins: [],           // no Pins here
  startThread: 0,
  critters: { silverfish: 0 },   // no critters in the tutorial
  waves: null,               // unused: the tutorial script spawns everything
  unlockOnClear: { scissors: 'safety' },   // already held, but the map shows the reveal: the reward loop starts here
  signText: '',
  starRules: { noDamage: true, noSpecial: true },
};

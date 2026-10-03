// Achievements: one-time Button rewards, as data. Each entry: { id, name, description, reward, check(report, save, ctx) }.
// check() runs after every finished run on a Button-earning level (meta.js settleRun), with:
//   report = the run report (game.js buildReport: won, level, towers {type: count}, boss, bestSnipKills, critterKills,
//            beetleExecutes, prunerBite, ...)
//   save   = the Save after the run was recorded (levels: { id: { stars, cleared } }, critterKills = lifetime squishes)
//   ctx    = { worldLevels(world) -> level ids, worldBoss(world) -> its level 10's id, levelAt(n) -> the id of global level n }
// The world achievements of the old three-world map (clear-lair, stars-lair) were retired with it: a save that earned
// them keeps the ids (and the Buttons), they just aren't listed. World 5 (snow) holds the old Lair's levels.
// Nothing here imports anything, so tools/buttonsupply.js can sum the rewards under Node.

const pinTypes = r => Object.values(r.towers || {}).filter(n => n > 0).length;
const allCleared = (ids, s) => ids.length > 0 && ids.every(id => s.levels[id] && s.levels[id].cleared);
const allThreeStar = (ids, s) => ids.length > 0 && ids.every(id => s.levels[id] && s.levels[id].stars >= 3);
const WORLD_NAMES = { meadow: 'World 1 (the Sewing Tray)', denim: 'World 2 (the Mending Pile)', autumn: 'World 3 (the Kitchen Drawer)',
  night: 'World 4 (the Bedside Drawer)', snow: 'World 5 (the Holiday Box)' };

const clearWorld = (n, world, reward, name) => ({ id: 'clear-' + world, name, description: 'Clear every level of ' + WORLD_NAMES[world] + '. Not a stitch out of place.',
  reward, world, check: (r, s, ctx) => allCleared(ctx.worldLevels(world), s) });
const starWorld = (world, name) => ({ id: 'stars-' + world, name, description: 'Three-star every level of ' + WORLD_NAMES[world] + '.',
  reward: 100, world, check: (r, s, ctx) => allThreeStar(ctx.worldLevels(world), s) });

export const ACHIEVEMENTS = [
  { id: 'snip6', name: 'Half Dozen', description: 'Cut 6 enemies with one snip.', reward: 25,
    check: r => r.bestSnipKills >= 6 },
  { id: 'snip10', name: 'Tailor’s Ten', description: 'Cut 10 enemies with one snip.', reward: 50,
    check: r => r.bestSnipKills >= 10 },
  { id: 'boss-no-needle', name: 'No Needles Needed', description: 'Beat a boss without placing a Needle Pin.', reward: 50,
    check: r => r.won && r.boss && !(r.towers && r.towers.needle) },
  { id: 'one-pin', name: 'One Trick', description: 'Beat a level using only one type of Pin.', reward: 25,
    check: r => r.won && pinTypes(r) === 1 },
  { id: 'no-pins', name: 'Bare Blades', description: 'Beat a level without placing a single Pin. Just you and the drawer.', reward: 75,
    check: r => r.won && pinTypes(r) === 0 },
  { id: 'cigar-beetle', name: 'Grandpa’s Trick', description: 'Execute a Button Beetle inside the Cigar Cutter’s ring. Nobody asks.', reward: 40,
    check: r => r.beetleExecutes > 0 },
  { id: 'pruner-bite', name: 'Ratchet Bite', description: 'End a boss’s armored phase with the Ratchet Pruners’ 3x bite.', reward: 40,
    check: r => !!r.prunerBite },
  // The only link between critters and Buttons, once each. A level holds at most 4 silverfish (World 3), so 4 is the
  // one-level maximum.
  { id: 'squish-level', name: 'Pest Control', description: 'Squish 4 silverfish in one level. The only real pests in here.', reward: 25,
    check: r => r.critterKills >= 4 },
  { id: 'squish-25', name: 'Silverfish Squasher', description: 'Squish 25 silverfish in total.', reward: 50,
    check: (r, s) => (s.critterKills | 0) >= 25 },
  clearWorld(1, 'meadow', 50, 'Meadow Mended'),
  clearWorld(2, 'denim', 75, 'Denim Darned'),
  clearWorld(3, 'autumn', 100, 'Drawer Swept'),
  clearWorld(4, 'night', 125, 'Lights Out'),
  clearWorld(5, 'snow', 150, 'Box Packed Away'),
  starWorld('meadow', 'Golden Meadow'),
  starWorld('denim', 'Golden Denim'),
  starWorld('autumn', 'Golden Harvest'),
  starWorld('night', 'Golden Hour'),
  starWorld('snow', 'Golden Snow'),
  // the id predates the five worlds (the Unstitcher was Level 12); it's the snow world's boss level now
  { id: 'beat-l12', name: 'Nobody Noticed', description: 'Beat The Back Seam and The Unstitcher. The house sleeps on.', reward: 150,
    check: (r, s, ctx) => { const id = ctx.worldBoss('snow'); return !!(id && s.levels[id] && s.levels[id].cleared); } },
];

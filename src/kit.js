// The level-art kit (assets/kit/): sprites and texture tiles that levelArt.js paints generated levels with. Art data,
// like the shapes in enemyArt.js: which files there are, their measured footprints, and which props each zone scatters.
// Sprites are delivered at 2x their size on the plate, all top-down with no shadows (levelArt adds those).
// Sprite entry: [file under assets/kit/, canvas w, h, visible centre cx, cy, visible radius r] (px of the file).

export const KIT_DIR = new URL('../assets/kit/', import.meta.url).href;

export const SPRITES = {
  // fixed level pieces
  pinPad:      ['fixed/sewing_pin_pad_01.webp', 340, 340, 175, 163, 150.9],
  heartPad:    ['fixed/sewing_heart_pad_01.webp', 460, 460, 238, 223, 205.9],
  forkButton:  ['fixed/sewing_fork_centrepiece_01.webp', 720, 720, 372, 360, 323.6],
  // sewing props (every zone)
  buttonBlue:   ['sewing/sewing_button_blue_01.webp', 140, 140, 69, 67.5, 66.8],
  buttonWood:   ['sewing/sewing_button_wood_01.webp', 140, 140, 69, 69.5, 66.7],
  buttonRed:    ['sewing/sewing_button_red_01.webp', 140, 140, 69.5, 68.5, 66.9],
  buttonNavy:   ['sewing/sewing_button_navy_01.webp', 140, 140, 69.5, 69.5, 66.7],
  buttonYellow: ['sewing/sewing_button_yellow_01.webp', 140, 140, 69.5, 69, 66.8],
  buttonPurple: ['sewing/sewing_button_purple_01.webp', 140, 140, 69.5, 70, 67],
  buttonCream:  ['sewing/sewing_button_cream_01.webp', 140, 140, 69.5, 70, 67.1],
  buttonGreen:  ['sewing/sewing_button_green_01.webp', 140, 140, 69.5, 69, 67.2],
  thimble:      ['sewing/sewing_thimble_brass_01.webp', 220, 220, 109, 110, 105.3],
  spoolRed:     ['sewing/sewing_spool_red_01.webp', 240, 240, 119, 119.5, 113.7],
  spoolBlue:    ['sewing/sewing_spool_blue_01.webp', 240, 240, 119, 119.5, 114],
  spoolGreen:   ['sewing/sewing_spool_green_01.webp', 240, 240, 119, 119.5, 114.5],
  safetyPin:    ['sewing/sewing_safety_pin_01.webp', 320, 120, 159.5, 59, 155],
  pinRed:       ['sewing/sewing_pin_red_01.webp', 200, 32, 99.5, 15.5, 45.6],
  pinBlue:      ['sewing/sewing_pin_blue_01.webp', 200, 32, 99, 15.5, 50.1],
  pinYellow:    ['sewing/sewing_pin_yellow_01.webp', 200, 32, 99.5, 15.5, 47.7],
  tape:         ['sewing/sewing_measuring_tape_01.webp', 360, 360, 179.5, 179.5, 181.7],
  yarnYellow:   ['sewing/sewing_yarn_ball_yellow_01.webp', 240, 240, 124.5, 115.5, 122.4],
  yarnTeal:     ['sewing/sewing_yarn_ball_teal_01.webp', 240, 240, 119.5, 119, 125.8],
  chalk:        ['sewing/sewing_tailors_chalk_01.webp', 200, 120, 100, 59.5, 76.1],
  pincushion:   ['sewing/sewing_tomato_pincushion_01.webp', 400, 400, 212, 205, 179.3],
  scrapPlaid:   ['sewing/sewing_scrap_red_plaid_01.webp', 400, 320, 199.5, 160, 221.2],
  scrapGingham: ['sewing/sewing_scrap_yellow_gingham_01.webp', 400, 320, 199, 159.5, 221.9],
  scrapDenim:   ['sewing/sewing_scrap_denim_01.webp', 400, 320, 200, 159.5, 223.3],
  scrapPolka:   ['sewing/sewing_scrap_polka_01.webp', 400, 320, 200, 159.5, 223.6],
  // meadow props
  treeS:      ['meadow/meadow_tree_small_01.webp', 280, 280, 139.5, 139.5, 134.9],
  treeM:      ['meadow/meadow_tree_medium_01.webp', 360, 360, 179.5, 179, 172.4],
  treeL:      ['meadow/meadow_tree_large_01.webp', 440, 440, 220, 219, 214.3],
  bush1:      ['meadow/meadow_bush_01.webp', 200, 200, 98.5, 99.5, 97.4],
  bush2:      ['meadow/meadow_bush_02.webp', 200, 200, 99, 100, 99.1],
  bush3:      ['meadow/meadow_bush_03.webp', 200, 200, 99, 99, 103.7],
  daisy:      ['meadow/meadow_flower_daisy_01.webp', 160, 160, 79, 79.5, 80.7],
  sunflower:  ['meadow/meadow_flower_sunflower_01.webp', 160, 160, 79.5, 79.5, 80.9],
  flowerPink: ['meadow/meadow_flower_pink_01.webp', 100, 100, 49.5, 49.5, 49.3],
  flowerBlue: ['meadow/meadow_flower_blue_01.webp', 100, 100, 49.5, 49.5, 50.3],
  flowerYellow: ['meadow/meadow_flower_yellow_01.webp', 80, 80, 39.5, 39, 41.3],
  flowerCream:  ['meadow/meadow_flower_cream_01.webp', 120, 120, 59.5, 59.5, 59.2],
  stoneS:     ['meadow/meadow_stone_small_01.webp', 140, 140, 69.5, 69, 66.8],
  stoneM:     ['meadow/meadow_stone_medium_01.webp', 190, 190, 94.5, 94, 92],
  stoneL:     ['meadow/meadow_stone_large_01.webp', 240, 240, 119.5, 119, 116.7],
  pond:       ['meadow/meadow_pond_duck_01.webp', 600, 400, 299.5, 198.5, 293.1],
  // lair props
  lumpS:      ['lair/lair_lump_small_01.webp', 240, 240, 119.5, 119.5, 115],
  lumpM:      ['lair/lair_lump_medium_01.webp', 320, 320, 159.5, 159.5, 154.5],
  lumpL:      ['lair/lair_lump_large_01.webp', 400, 400, 199, 199.5, 195.1],
  tangle1:    ['lair/lair_thread_tangle_01.webp', 320, 320, 159, 160.5, 164],
  tangle2:    ['lair/lair_thread_tangle_02.webp', 320, 320, 159.5, 159.5, 163.9],
  pincushionLair: ['lair/lair_pincushion_01.webp', 360, 360, 179.5, 179.5, 190.9],
  lantern:    ['lair/lair_lantern_01.webp', 120, 120, 59.5, 59, 57.2],
  needle:     ['lair/lair_broken_needle_01.webp', 280, 40, 140, 20, 135.4],
  // map ratings
  starGold:   ['sewing/sewing_star_gold_01.webp', 96, 96, 47.5, 47.5, 52.3],
  starEmpty:  ['sewing/sewing_star_empty_01.webp', 96, 96, 47.5, 47.5, 52.3],
};

export const TEXTURES = {
  denim: 'textures/denim_ground_01.webp', meadow: 'textures/meadow_ground_01.webp', lair: 'textures/lair_ground_01.webp',
  roadFelt: 'textures/sewing_road_felt_01.webp', roadEdge: 'textures/sewing_road_edge_01.webp',
  patchRedPlaid: 'textures/sewing_patch_red_plaid_01.webp', patchBluePlaid: 'textures/sewing_patch_blue_plaid_01.webp',
  patchGingham: 'textures/sewing_patch_yellow_gingham_01.webp', patchPolka: 'textures/sewing_patch_polka_01.webp',
};

// Scatter sets: [sprite, weight, min scale, max scale, turn] (scale 0.5 = the plate size the sprite was drawn for;
// turn = how far it may be rotated, in radians: 3.2 = any way, small = stays roughly upright).
const SEWING = [
  ['buttonBlue', 0.45, 0.35, 0.55, 3.2], ['buttonWood', 0.45, 0.35, 0.55, 3.2], ['buttonRed', 0.45, 0.35, 0.55, 3.2],
  ['buttonNavy', 0.45, 0.35, 0.55, 3.2], ['buttonYellow', 0.45, 0.35, 0.55, 3.2], ['buttonPurple', 0.45, 0.35, 0.55, 3.2],
  ['buttonCream', 0.45, 0.35, 0.55, 3.2], ['buttonGreen', 0.45, 0.35, 0.55, 3.2],
  ['thimble', 0.8, 0.42, 0.52, 3.2], ['spoolRed', 0.6, 0.45, 0.55, 3.2], ['spoolBlue', 0.6, 0.45, 0.55, 3.2],
  ['spoolGreen', 0.6, 0.45, 0.55, 3.2], ['safetyPin', 0.6, 0.45, 0.55, 3.2], ['pinRed', 0.5, 0.55, 0.65, 3.2],
  ['pinBlue', 0.5, 0.55, 0.65, 3.2], ['pinYellow', 0.5, 0.55, 0.65, 3.2], ['tape', 0.6, 0.42, 0.52, 3.2],
  ['yarnYellow', 0.6, 0.42, 0.52, 3.2], ['yarnTeal', 0.6, 0.42, 0.52, 3.2], ['chalk', 0.4, 0.42, 0.5, 3.2],
  ['pincushion', 0.5, 0.42, 0.52, 3.2], ['scrapPlaid', 0.35, 0.4, 0.5, 0.5], ['scrapGingham', 0.35, 0.4, 0.5, 0.5],
  ['scrapDenim', 0.35, 0.4, 0.5, 0.5], ['scrapPolka', 0.35, 0.4, 0.5, 0.5],
];
const MEADOW = [
  ['treeS', 1.2, 0.45, 0.55, 3.2], ['treeM', 1.1, 0.45, 0.55, 3.2], ['treeL', 0.9, 0.45, 0.55, 3.2],
  ['bush1', 1, 0.45, 0.6, 3.2], ['bush2', 1, 0.45, 0.6, 3.2], ['bush3', 1, 0.45, 0.6, 3.2],
  ['daisy', 1.2, 0.4, 0.55, 3.2], ['sunflower', 1, 0.4, 0.55, 3.2], ['flowerPink', 1.2, 0.45, 0.6, 3.2],
  ['flowerBlue', 1.2, 0.45, 0.6, 3.2], ['flowerYellow', 1.2, 0.5, 0.65, 3.2], ['flowerCream', 1, 0.45, 0.6, 3.2],
  ['stoneS', 0.7, 0.45, 0.55, 3.2], ['stoneM', 0.6, 0.45, 0.55, 3.2], ['stoneL', 0.4, 0.45, 0.55, 3.2],
  ['pond', 0.35, 0.45, 0.52, 0.25],
];
const LAIR = [
  ['lumpS', 1.2, 0.45, 0.55, 0.35], ['lumpM', 1, 0.45, 0.55, 0.35], ['lumpL', 0.7, 0.45, 0.55, 0.35],
  ['tangle1', 1, 0.42, 0.55, 3.2], ['tangle2', 1, 0.42, 0.55, 3.2], ['pincushionLair', 0.6, 0.42, 0.52, 3.2],
  ['lantern', 0.8, 0.5, 0.6, 3.2], ['needle', 0.7, 0.5, 0.6, 3.2],
];

// Per zone (a level file's `world`): ground texture, whether the ground gets quilt seams and tone squares, the road's
// stitch colour, which patch fabrics show under the road, and the scatter sets with the share of props from each.
export const ZONES = {
  meadow: { ground: 'meadow', seams: false, stitch: '#6e4524', patches: ['patchGingham', 'patchRedPlaid'], sets: [[MEADOW, 0.85], [SEWING, 0.15]] },
  denim:  { ground: 'denim', seams: true, stitch: '#6e4524', patches: ['patchRedPlaid', 'patchBluePlaid', 'patchGingham', 'patchPolka'], sets: [[SEWING, 1]] },
  lair:   { ground: 'lair', seams: false, stitch: '#4a2a50', patches: ['patchBluePlaid', 'patchPolka'], sets: [[LAIR, 0.75], [SEWING, 0.25]] },
};

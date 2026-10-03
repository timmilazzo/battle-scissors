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
  // per-zone pads (round 2; the fixed pinPad / heartPad above are the old zone-less ones)
  meadowPinPad:   ['09_zone_pads/meadow_pin_pad_01.png', 340, 340, 170, 169.5, 164],
  denimPinPad:    ['09_zone_pads/denim_pin_pad_01.png', 340, 340, 170, 169.5, 164],
  lairPinPad:     ['09_zone_pads/lair_pin_pad_01.png', 340, 340, 170, 169.5, 164],
  meadowHeartPad: ['09_zone_pads/meadow_heart_pad_01.png', 460, 460, 230, 229.5, 222],
  denimHeartPad:  ['09_zone_pads/denim_heart_pad_01.png', 460, 460, 230, 229.5, 222],
  lairHeartPad:   ['09_zone_pads/lair_heart_pad_01.png', 460, 460, 230, 230, 222],
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
  // round 3: frames, heroes, road kit, ground clusters, denim props (assets/kit/18_frames .. 22_denim)
  // 18_frames: frame pieces per zone (strips drawn horizontal, bottom long edge toward the play area)
  meadowFrameRim1:        ['18_frames/meadow_frame_rim_01.webp', 1024, 112, 511.5, 49, 513.8],
  meadowFrameRim2:        ['18_frames/meadow_frame_rim_02.webp', 1024, 112, 511.5, 51, 514],
  meadowFrameDivider:     ['18_frames/meadow_frame_divider_01.webp', 512, 64, 255.5, 31.5, 257.3],
  meadowFrameOuterCorner: ['18_frames/meadow_frame_outer_corner_01.webp', 280, 280, 139.5, 139, 177.5],
  meadowFrameInnerCorner: ['18_frames/meadow_frame_inner_corner_01.webp', 280, 280, 139.5, 139.5, 184.6],
  meadowFrameCap:         ['18_frames/meadow_frame_end_cap_01.webp', 112, 160, 55.5, 79.5, 80.2],
  meadowFrameT:           ['18_frames/meadow_frame_t_joint_01.webp', 200, 200, 99.5, 99.5, 118.1],
  denimFrameRim1:         ['18_frames/denim_frame_rim_01.webp', 1024, 112, 511.5, 55.5, 514.5],
  denimFrameRim2:         ['18_frames/denim_frame_rim_02.webp', 1024, 112, 511.5, 55.5, 514.5],
  denimFrameDivider:      ['18_frames/denim_frame_divider_01.webp', 512, 64, 255.5, 31.5, 257.4],
  denimFrameOuterCorner:  ['18_frames/denim_frame_outer_corner_01.webp', 280, 280, 139.5, 139, 174.9],
  denimFrameInnerCorner:  ['18_frames/denim_frame_inner_corner_01.webp', 280, 280, 139.5, 139.5, 181.2],
  denimFrameCap:          ['18_frames/denim_frame_end_cap_01.webp', 112, 160, 55, 79.5, 84.2],
  denimFrameT:            ['18_frames/denim_frame_t_joint_01.webp', 200, 200, 99.5, 99, 114.4],
  lairFrameRim1:          ['18_frames/lair_frame_rim_01.webp', 1024, 112, 511.5, 55.5, 514.5],
  lairFrameRim2:          ['18_frames/lair_frame_rim_02.webp', 1024, 112, 511.5, 55.5, 514.5],
  lairFrameDivider:       ['18_frames/lair_frame_divider_01.webp', 512, 64, 255.5, 31.5, 257.4],
  lairFrameOuterCorner:   ['18_frames/lair_frame_outer_corner_01.webp', 280, 280, 139.5, 139.5, 175.2],
  lairFrameInnerCorner:   ['18_frames/lair_frame_inner_corner_01.webp', 280, 280, 139.5, 139, 180.3],
  lairFrameCap:           ['18_frames/lair_frame_end_cap_01.webp', 112, 160, 55.5, 79.5, 83.7],
  lairFrameT:             ['18_frames/lair_frame_t_joint_01.webp', 200, 200, 99.5, 99, 110.2],
  // 19_heroes: hero props for the frame compartments
  heroSpoolRed:        ['19_heroes/meadow_hero_spool_red_01.webp', 960, 600, 479.5, 299.5, 484.3],
  heroSpoolBlue:       ['19_heroes/meadow_hero_spool_blue_01.webp', 960, 600, 479.5, 299.5, 487.1],
  heroSpoolGreen:      ['19_heroes/meadow_hero_spool_green_01.webp', 900, 900, 449.5, 449, 432.4],
  heroSpoolYellow:     ['19_heroes/meadow_hero_spool_yellow_01.webp', 900, 900, 449.5, 449.5, 432.5],
  heroButtonJar:       ['19_heroes/meadow_hero_button_jar_01.webp', 720, 720, 359.5, 359, 346.5],
  heroPincushion:      ['19_heroes/meadow_hero_pincushion_01.webp', 900, 900, 449.5, 449.5, 443],
  heroFabricBlue:      ['19_heroes/meadow_hero_fabric_blue_01.webp', 1040, 680, 519.5, 339, 564.1],
  heroFabricGingham:   ['19_heroes/meadow_hero_fabric_gingham_01.webp', 1040, 680, 519, 340, 557.7],
  heroYarnNeedles:     ['19_heroes/meadow_hero_yarn_needles_01.webp', 840, 840, 419, 419.5, 531.2],
  heroTape:            ['19_heroes/denim_hero_tape_measure_01.webp', 920, 920, 459.5, 459.5, 490.7],
  heroButtonTin:       ['19_heroes/denim_hero_button_tin_01.webp', 880, 880, 439.5, 439.5, 423.5],
  heroDenimBolt:       ['19_heroes/denim_hero_denim_bolt_01.webp', 1280, 600, 639.5, 299.5, 627.2],
  heroSpoolBox:        ['19_heroes/denim_hero_spool_box_01.webp', 1000, 720, 499.5, 359, 542.7],
  heroThimble:         ['19_heroes/denim_hero_thimble_01.webp', 600, 600, 299.5, 299, 288.1],
  heroSeamRipper:      ['19_heroes/lair_hero_seam_ripper_01.webp', 1400, 320, 699.5, 160, 692.8],
  heroPincushionLair:  ['19_heroes/lair_hero_pincushion_01.webp', 880, 880, 439.5, 439.5, 451.9],
  heroDarningMushroom: ['19_heroes/lair_hero_darning_mushroom_01.webp', 720, 720, 359.5, 359, 346],
  heroBobbinTangle:    ['19_heroes/lair_hero_bobbin_tangle_01.webp', 960, 960, 479, 479.5, 504.9],
  heroDoily:           ['19_heroes/lair_hero_torn_doily_01.webp', 1000, 1000, 500, 499, 509.6],
  // 20_road: road kit: meadow fence, denim / lair edge strips, decals on the felt
  fencePost1:   ['20_road/meadow_fence_post_01.webp', 56, 56, 27, 27.5, 25.2],
  fencePost2:   ['20_road/meadow_fence_post_02.webp', 56, 56, 27.5, 27.5, 25.1],
  fencePost3:   ['20_road/meadow_fence_post_03.webp', 56, 56, 27.5, 27.5, 25],
  ropeLink1:    ['20_road/meadow_rope_link_01.webp', 128, 28, 63.5, 13.5, 46.8],
  ropeLink2:    ['20_road/meadow_rope_link_02.webp', 128, 28, 63, 13.5, 33.1],
  fenceRail1:   ['20_road/meadow_fence_rail_01.webp', 128, 24, 63.5, 11.5, 30.4],
  fenceRail2:   ['20_road/meadow_fence_rail_02.webp', 128, 24, 63.5, 11.5, 31.7],
  roadDarn1:    ['20_road/sewing_road_darned_patch_01.webp', 260, 180, 129.5, 89.5, 135.8],
  roadDarn2:    ['20_road/sewing_road_darned_patch_02.webp', 260, 180, 129, 89.5, 134.8],
  bootL:        ['20_road/sewing_road_boot_print_left_01.webp', 68, 120, 33.5, 59, 52.4],
  bootR:        ['20_road/sewing_road_boot_print_right_01.webp', 68, 120, 33.5, 59.5, 52.3],
  roadPin1:     ['20_road/sewing_road_pin_01.webp', 180, 28, 89.5, 13.5, 42.6],
  roadPin2:     ['20_road/sewing_road_pin_02.webp', 180, 28, 89, 13.5, 40.2],
  chalkArrow:   ['20_road/sewing_road_chalk_arrow_01.webp', 140, 200, 69.5, 99, 77.7],
  denimSelvage: ['20_road/denim_road_selvage_01.webp', 512, 56, 255.5, 27.5, 256.8],
  denimFrayed:  ['20_road/denim_road_frayed_01.webp', 512, 56, 255.5, 27, 256.9],
  lairPinned1:  ['20_road/lair_road_pinned_01.webp', 512, 64, 255.5, 31.5, 257.3],
  lairPinned2:  ['20_road/lair_road_pinned_02.webp', 512, 64, 255.5, 31.5, 257.2],
  // 21_ground: ground clusters
  flowerBed1:  ['21_ground/meadow_flower_bed_01.webp', 440, 320, 219.5, 159.5, 216],
  flowerBed2:  ['21_ground/meadow_flower_bed_02.webp', 440, 320, 219, 159, 213.7],
  flowerBed3:  ['21_ground/meadow_flower_bed_03.webp', 440, 320, 219.5, 159, 213.7],
  grassTuft1:  ['21_ground/meadow_grass_tuft_01.webp', 120, 100, 59.5, 49, 57.2],
  grassTuft2:  ['21_ground/meadow_grass_tuft_02.webp', 120, 100, 59.5, 49, 57.4],
  grassTuft3:  ['21_ground/meadow_grass_tuft_03.webp', 120, 100, 59.5, 49, 57.1],
  mossMeadow:  ['21_ground/meadow_moss_patch_01.webp', 400, 300, 200, 149, 193.4],
  mossLair:    ['21_ground/lair_moss_patch_01.webp', 400, 300, 199, 149, 193],
  buttonSpill: ['21_ground/sewing_button_spill_01.webp', 400, 300, 199, 149, 193.8],
  pinScatter:  ['21_ground/sewing_pin_scatter_01.webp', 320, 240, 159.5, 119.5, 158.3],
  // 22_denim: denim props
  beltLoop1:   ['22_denim/denim_belt_loop_01.webp', 100, 220, 49, 109, 110.4],
  beltLoop2:   ['22_denim/denim_belt_loop_02.webp', 100, 220, 49.5, 109, 105.3],
  cuff:        ['22_denim/denim_cuff_01.webp', 640, 160, 319, 78.5, 249],
  frayedHole1: ['22_denim/denim_frayed_hole_01.webp', 280, 280, 139.5, 139, 141.6],
  frayedHole2: ['22_denim/denim_frayed_hole_02.webp', 280, 280, 139.5, 140, 133.7],
  pocket1:     ['22_denim/denim_pocket_01.webp', 400, 440, 199.5, 219, 241.9],
  pocket2:     ['22_denim/denim_pocket_02.webp', 400, 440, 198.5, 217.5, 241.2],
  rivet1:      ['22_denim/denim_rivet_01.webp', 60, 60, 29.5, 29, 27.2],
  rivet2:      ['22_denim/denim_rivet_02.webp', 60, 60, 29.5, 29.5, 27.3],
  rivet3:      ['22_denim/denim_rivet_03.webp', 60, 60, 29.5, 29.5, 27.3],
  tackBrass:   ['22_denim/denim_tack_button_brass_01.webp', 100, 100, 50, 49, 47.3],
  tackSilver:  ['22_denim/denim_tack_button_silver_01.webp', 100, 100, 49.5, 49, 47.1],
  zipper:      ['22_denim/denim_zipper_01.webp', 120, 520, 59.5, 259.5, 260.5],
  // round 3.1 (24_heart_damage): each zone's heart pad in four damage stages, registered to the undamaged pad (render.js
  // draws the stage for the workshop's HP over the plate), and the loose bits of the hit burst when something gets through
  meadowHeartPadDmg1: ['24_heart_damage/meadow_heart_pad_dmg1.webp', 460, 460, 229.5, 229, 225],
  meadowHeartPadDmg2: ['24_heart_damage/meadow_heart_pad_dmg2.webp', 460, 460, 229.5, 229, 225.4],
  meadowHeartPadDmg3: ['24_heart_damage/meadow_heart_pad_dmg3.webp', 460, 460, 229.5, 229, 225.2],
  meadowHeartPadDmg4: ['24_heart_damage/meadow_heart_pad_dmg4.webp', 460, 460, 229.5, 229, 225.2],
  denimHeartPadDmg1:  ['24_heart_damage/denim_heart_pad_dmg1.webp', 460, 460, 229.5, 229, 219.3],
  denimHeartPadDmg2:  ['24_heart_damage/denim_heart_pad_dmg2.webp', 460, 460, 229.5, 229, 219.1],
  denimHeartPadDmg3:  ['24_heart_damage/denim_heart_pad_dmg3.webp', 460, 460, 229.5, 229, 219.3],
  denimHeartPadDmg4:  ['24_heart_damage/denim_heart_pad_dmg4.webp', 460, 460, 229.5, 229, 219.1],
  lairHeartPadDmg1:   ['24_heart_damage/lair_heart_pad_dmg1.webp', 460, 460, 229.5, 229.5, 231.9],
  lairHeartPadDmg2:   ['24_heart_damage/lair_heart_pad_dmg2.webp', 460, 460, 229.5, 229.5, 231.9],
  lairHeartPadDmg3:   ['24_heart_damage/lair_heart_pad_dmg3.webp', 460, 460, 229.5, 229.5, 231.9],
  lairHeartPadDmg4:   ['24_heart_damage/lair_heart_pad_dmg4.webp', 460, 460, 229.5, 229.5, 231.5],
  puff1:      ['24_hit_burst/sewing_stuffing_puff_01.webp', 80, 80, 39.5, 39.5, 39.3],
  puff2:      ['24_hit_burst/sewing_stuffing_puff_02.webp', 80, 80, 39.5, 39.5, 40.5],
  puff3:      ['24_hit_burst/sewing_stuffing_puff_03.webp', 80, 80, 39.5, 39.5, 46.3],
  threadEnd1: ['24_hit_burst/sewing_thread_end_01.webp', 80, 80, 39.5, 39.5, 43.4],
  threadEnd2: ['24_hit_burst/sewing_thread_end_02.webp', 80, 80, 39.5, 39.5, 43.5],
  threadEnd3: ['24_hit_burst/sewing_thread_end_03.webp', 80, 80, 39, 39.5, 45.2],
  stitchBit1: ['24_hit_burst/sewing_stitch_bit_01.webp', 60, 60, 29.5, 29.5, 30.2],
  stitchBit2: ['24_hit_burst/sewing_stitch_bit_02.webp', 60, 60, 29.5, 29, 29.8],
  // round 4 (25_drawer_heroes): kitchen-drawer junk at hero size, placed by hand (level lab Dress mode, `dressing`)
  heroBattery:  ['25_drawer_heroes/sewing_hero_battery_01.webp', 660, 220, 329.5, 109.5, 326],
  heroPen:      ['25_drawer_heroes/sewing_hero_pen_01.webp', 1800, 160, 899.5, 79, 896.9],
  heroBandTan:  ['25_drawer_heroes/sewing_hero_rubber_band_tan_01.webp', 1000, 840, 499.5, 419, 498.7],
  heroBandRed:  ['25_drawer_heroes/sewing_hero_rubber_band_red_01.webp', 1000, 840, 499.5, 419.5, 484.6],
  heroMenu:     ['25_drawer_heroes/sewing_hero_takeout_menu_01.webp', 2600, 1800, 1299.5, 899.5, 1333.2],
  heroKey:      ['25_drawer_heroes/sewing_hero_house_key_01.webp', 840, 360, 419.5, 179.5, 421.5],
  heroBagClip:  ['25_drawer_heroes/sewing_hero_bag_clip_01.webp', 1040, 360, 519.5, 179.5, 520.7],
  heroCandle1:  ['25_drawer_heroes/sewing_hero_birthday_candle_01.webp', 760, 120, 379.5, 59.5, 377.8],
  heroCandle2:  ['25_drawer_heroes/sewing_hero_birthday_candle_02.webp', 760, 120, 379.5, 59.5, 379.5],
  heroGiftCard: ['25_drawer_heroes/sewing_hero_gift_card_01.webp', 1080, 680, 539.5, 339, 569.8],
  // round 4 (26_drawer_small): small drawer junk for the scatter (every zone's clusters and singles)
  paperclip1: ['26_drawer_small/sewing_paperclip_01.webp', 400, 160, 199.5, 79.5, 196.5],
  paperclip2: ['26_drawer_small/sewing_paperclip_02.webp', 400, 160, 199.5, 79.5, 139.4],
  breadClip1: ['26_drawer_small/sewing_bread_clip_01.webp', 260, 220, 129.5, 109.5, 139.5],
  breadClip2: ['26_drawer_small/sewing_bread_clip_02.webp', 260, 220, 129.5, 109.5, 140.3],
  bottleCap1: ['26_drawer_small/sewing_bottle_cap_01.webp', 380, 380, 189.5, 189, 184.7],
  bottleCap2: ['26_drawer_small/sewing_bottle_cap_02.webp', 380, 380, 189.5, 189.5, 184.7],
  twistTie1:  ['26_drawer_small/sewing_twist_tie_01.webp', 600, 240, 299, 119.5, 139.1],
  twistTie2:  ['26_drawer_small/sewing_twist_tie_02.webp', 600, 240, 299.5, 119.5, 135.2],
  screw1:     ['26_drawer_small/sewing_screw_01.webp', 320, 120, 159.5, 59.5, 98.1],
  screw2:     ['26_drawer_small/sewing_screw_02.webp', 320, 120, 159, 59.5, 94],
  screw3:     ['26_drawer_small/sewing_screw_03.webp', 320, 120, 159.5, 59.5, 113.4],
  coin1:      ['26_drawer_small/sewing_coin_01.webp', 300, 300, 149.5, 149.5, 143.7],
  coin2:      ['26_drawer_small/sewing_coin_02.webp', 300, 300, 149.5, 149.5, 143.7],
  hairTie1:   ['26_drawer_small/sewing_hair_tie_01.webp', 480, 480, 239.5, 239.5, 230.3],
  hairTie2:   ['26_drawer_small/sewing_hair_tie_02.webp', 480, 480, 239.5, 239, 230.9],
  bandTangle: ['26_drawer_small/sewing_band_tie_tangle_01.webp', 840, 720, 419.5, 359.5, 467.7],
  coinSpill:  ['26_drawer_small/sewing_coin_screw_spill_01.webp', 800, 600, 399.5, 299.5, 408.5],
  // round 5 (assets/kit/28_shared .. 31_snow, 04_chests, 09_zone_pads): the five worlds, as delivered (about a quarter of
  // the wishlist's 2x size, so ZONES' scale ranges are set from these pixels: plate size = file px x scale)
  // 28_shared
  flagPostL:      ['28_shared/sewing_flag_post_left_01.webp', 230, 205, 114.5, 101.5, 128.2],
  flagPostR:      ['28_shared/sewing_flag_post_right_01.webp', 227, 205, 113, 101.5, 127.5],
  padRing:        ['28_shared/sewing_pad_ring_01.webp', 354, 312, 176.5, 155.5, 180.8],
  pond1:          ['28_shared/sewing_pond_01.webp', 266, 186, 133, 92.5, 130.1],
  pond2:          ['28_shared/sewing_pond_02.webp', 308, 254, 153, 126.5, 153.2],
  pond3:          ['28_shared/sewing_pond_03.webp', 251, 303, 124.5, 151, 149.7],
  riverBrown:     ['28_shared/sewing_river_brown_01.webp', 455, 126, 227, 62, 225.6],
  riverBlue:      ['28_shared/sewing_river_blue_01.webp', 428, 126, 213.5, 62, 212.5],
  riverBendBrown: ['28_shared/sewing_river_bend_brown_01.webp', 146, 181, 69.5, 93, 101.5],
  riverBendBlue:  ['28_shared/sewing_river_bend_blue_01.webp', 151, 181, 74, 92, 100.4],
  rulerBridge:    ['28_shared/sewing_ruler_bridge_01.webp', 381, 181, 189, 92.5, 196.2],
  lanternLit1:    ['28_shared/sewing_lantern_lit_01.webp', 157, 206, 78, 102.5, 95.1],
  lanternLit2:    ['28_shared/sewing_lantern_lit_02.webp', 133, 204, 66, 102, 94.2],
  snowPost1:      ['28_shared/snow_fence_post_01.webp', 131, 201, 65, 101.5, 90.9],
  snowPost2:      ['28_shared/snow_fence_post_02.webp', 131, 201, 64, 101, 91],
  snowPost3:      ['28_shared/snow_fence_post_03.webp', 131, 201, 68, 108.5, 84.2],
  snowRail1:      ['28_shared/snow_fence_rail_01.webp', 336, 128, 167.5, 63, 161.6],
  snowRail2:      ['28_shared/snow_fence_rail_02.webp', 341, 129, 169.5, 64, 164.3],
  snowFrameRim1:  ['28_shared/snow_frame_rim_01.webp', 438, 90, 218.5, 44, 211.4],
  snowFrameRim2:  ['28_shared/snow_frame_rim_02.webp', 467, 91, 233, 45, 226.6],
  snowFrameCap:   ['28_shared/snow_frame_end_cap_01.webp', 88, 111, 43, 55, 52.5],
  lanternGlow:    ['28_shared/sewing_lantern_glow_01.webp', 594, 579, 296.5, 289, 190.1],
  windowGlow:     ['28_shared/sewing_window_glow_01.webp', 689, 539, 344, 269.5, 266.9],
  // 29_autumn
  leafRedBig:        ['29_autumn/autumn_leaf_red_big_01.webp', 186, 241, 97, 122.5, 104.9],
  leafGoldBig:       ['29_autumn/autumn_leaf_gold_big_01.webp', 181, 241, 90, 121, 105.2],
  heroPumpkinOrange: ['29_autumn/autumn_hero_pumpkin_orange_01.webp', 181, 241, 90, 126.5, 104.7],
  heroPumpkinGreen:  ['29_autumn/autumn_hero_pumpkin_green_01.webp', 176, 241, 87.5, 121, 128.4],
  heroHoneyDipper:   ['29_autumn/autumn_hero_honey_dipper_01.webp', 86, 241, 42.5, 123.5, 105.8],
  heroCopperMug:     ['29_autumn/autumn_hero_copper_mug_01.webp', 161, 181, 80, 80.5, 113.5],
  heroBottleOpener:  ['29_autumn/autumn_hero_bottle_opener_01.webp', 131, 246, 65, 126, 112.6],
  heroTwine:         ['29_autumn/autumn_hero_twine_01.webp', 151, 196, 71.5, 87, 112.6],
  berryBunch:        ['29_autumn/autumn_berry_bunch_01.webp', 273, 261, 136, 130, 146.4],
  pineConePile:      ['29_autumn/autumn_pine_cone_pile_01.webp', 281, 260, 140, 129.5, 141.6],
  leafDrift:         ['29_autumn/autumn_leaf_drift_01.webp', 300, 241, 150, 119.5, 152.4],
  toadstoolPair:     ['29_autumn/autumn_toadstool_pair_01.webp', 239, 204, 119, 101.5, 114.2],
  pineCone:          ['29_autumn/autumn_pine_cone_01.webp', 144, 184, 72, 91, 84.1],
  acorn:             ['29_autumn/autumn_acorn_01.webp', 134, 184, 62.5, 95, 80.2],
  toadstool:         ['29_autumn/autumn_toadstool_01.webp', 148, 157, 73.5, 78, 70.8],
  pumpkinSmall:      ['29_autumn/autumn_pumpkin_small_01.webp', 151, 159, 77, 76, 70.6],
  leafGold:          ['29_autumn/autumn_leaf_gold_01.webp', 149, 159, 70.5, 79, 76.8],
  leafRed:           ['29_autumn/autumn_leaf_red_01.webp', 146, 166, 72.5, 82.5, 75.3],
  twig:              ['29_autumn/autumn_twig_01.webp', 110, 212, 54, 105.5, 104.5],
  buttonRust:        ['29_autumn/autumn_button_rust_01.webp', 146, 149, 72.5, 74, 67.2],
  fillLeafGold:      ['29_autumn/autumn_fill_leaf_gold_01.webp', 81, 95, 40, 46.5, 45.6],
  fillLeafOrange:    ['29_autumn/autumn_fill_leaf_orange_01.webp', 85, 91, 42, 44.5, 47.1],
  fillLeafRed:       ['29_autumn/autumn_fill_leaf_red_01.webp', 91, 98, 45, 48.5, 52.9],
  fillSeed:          ['29_autumn/autumn_fill_seed_01.webp', 80, 99, 40, 49, 47.2],
  fillBerry:         ['29_autumn/autumn_fill_berry_01.webp', 78, 79, 38.5, 39, 40],
  heroMapleRed:      ['29_autumn/autumn_hero_maple_red_01.webp', 636, 671, 324.5, 331, 334.5],
  heroMapleGold:     ['29_autumn/autumn_hero_maple_gold_01.webp', 641, 671, 314, 338, 335.8],
  // 04_chests
  autumnChestLocked: ['04_chests/autumn_chest_locked.webp', 349, 231, 174, 114.5, 181],
  autumnChestReady:  ['04_chests/autumn_chest_ready.webp', 349, 234, 174, 116.5, 180.2],
  autumnChestOpen:   ['04_chests/autumn_chest_open.webp', 333, 316, 165.5, 157.5, 203],
  nightChestLocked:  ['04_chests/night_chest_locked.webp', 332, 217, 165.5, 108, 173],
  nightChestReady:   ['04_chests/night_chest_ready.webp', 333, 220, 166, 109.5, 174.5],
  nightChestOpen:    ['04_chests/night_chest_open.webp', 319, 266, 159, 132.5, 184.1],
  snowChestLocked:   ['04_chests/snow_chest_locked.webp', 507, 509, 253, 254, 317.8],
  snowChestReady:    ['04_chests/snow_chest_ready.webp', 508, 510, 253.5, 254.5, 317.8],
  snowChestOpen:     ['04_chests/snow_chest_open.webp', 519, 587, 259.5, 293, 331.6],
  // 09_zone_pads
  autumnPinPad:       ['09_zone_pads/autumn_pin_pad_01.webp', 340, 340, 170, 169.5, 164],
  autumnHeartPad:     ['09_zone_pads/autumn_heart_pad_01.webp', 460, 460, 230, 229.5, 223.8],
  autumnHeartPadDmg1: ['09_zone_pads/autumn_heart_pad_dmg1.webp', 460, 460, 230, 229.5, 225.4],
  autumnHeartPadDmg2: ['09_zone_pads/autumn_heart_pad_dmg2.webp', 460, 460, 230, 229.5, 225.4],
  autumnHeartPadDmg3: ['09_zone_pads/autumn_heart_pad_dmg3.webp', 460, 460, 229.5, 229.5, 224.8],
  autumnHeartPadDmg4: ['09_zone_pads/autumn_heart_pad_dmg4.webp', 460, 460, 230, 229.5, 224.7],
  nightPinPad:        ['09_zone_pads/night_pin_pad_01.webp', 340, 340, 170, 169.5, 164],
  nightHeartPad:      ['09_zone_pads/night_heart_pad_01.webp', 460, 460, 230, 229.5, 223],
  nightHeartPadDmg1:  ['09_zone_pads/night_heart_pad_dmg1.webp', 460, 460, 230, 229.5, 224.2],
  nightHeartPadDmg2:  ['09_zone_pads/night_heart_pad_dmg2.webp', 460, 460, 230, 229.5, 224.4],
  nightHeartPadDmg3:  ['09_zone_pads/night_heart_pad_dmg3.webp', 460, 460, 229.5, 229.5, 224.5],
  nightHeartPadDmg4:  ['09_zone_pads/night_heart_pad_dmg4.webp', 460, 460, 230, 229.5, 224.2],
  snowPinPad:         ['09_zone_pads/snow_pin_pad_01.webp', 340, 340, 170, 169.5, 168.5],
  snowHeartPad:       ['09_zone_pads/snow_heart_pad_01.webp', 460, 460, 229.5, 229.5, 227],
  snowHeartPadDmg1:   ['09_zone_pads/snow_heart_pad_dmg1.webp', 460, 460, 229.5, 229.5, 227.4],
  snowHeartPadDmg2:   ['09_zone_pads/snow_heart_pad_dmg2.webp', 460, 460, 229.5, 229.5, 227.3],
  snowHeartPadDmg3:   ['09_zone_pads/snow_heart_pad_dmg3.webp', 460, 460, 230, 229.5, 226.6],
  snowHeartPadDmg4:   ['09_zone_pads/snow_heart_pad_dmg4.webp', 460, 460, 230, 229.5, 228.6],
  // 30_night
  heroLavenderBig:   ['30_night/night_hero_lavender_big_01.webp', 251, 266, 128.5, 132.5, 131.5],
  heroLavenderSmall: ['30_night/night_hero_lavender_small_01.webp', 132, 266, 65.5, 142, 108.3],
  heroBrassKey:      ['30_night/night_hero_key_01.webp', 116, 266, 53.5, 133.5, 108.1],
  heroPencil:        ['30_night/night_hero_pencil_01.webp', 67, 205, 33, 102, 94.2],
  heroCookieCutter:  ['30_night/night_hero_cookie_cutter_01.webp', 190, 197, 94.5, 98, 104.9],
  heroClothespin:    ['30_night/night_hero_clothespin_01.webp', 82, 234, 40, 116.5, 111.6],
  heroSpoon:         ['30_night/night_hero_spoon_01.webp', 121, 261, 64, 143, 109.8],
  heroMoon:          ['30_night/night_hero_moon_01.webp', 151, 261, 71.5, 130, 123.4],
  lavenderBed:       ['30_night/night_lavender_bed_01.webp', 321, 247, 160.5, 123, 171.8],
  berrySprig:        ['30_night/night_berry_sprig_01.webp', 223, 266, 111, 132.5, 148],
  pebblePile:        ['30_night/night_pebble_pile_01.webp', 279, 225, 139, 112.5, 143.3],
  lanternBig:        ['30_night/night_lantern_big_01.webp', 154, 276, 77, 137, 131.6],
  lanternSmall:      ['30_night/night_lantern_small_01.webp', 118, 191, 58, 95, 90],
  marble:            ['30_night/night_marble_01.webp', 149, 152, 74, 75.5, 68.1],
  paperclip:         ['30_night/night_paperclip_01.webp', 96, 169, 47.5, 84, 78.9],
  bottleCap:         ['30_night/night_bottle_cap_01.webp', 163, 164, 81, 81.5, 75.6],
  pebble:            ['30_night/night_pebble_01.webp', 101, 173, 53.5, 100.5, 58.7],
  keySmall:          ['30_night/night_key_small_01.webp', 101, 173, 45.5, 86, 79.9],
  toadstoolNight:    ['30_night/night_toadstool_01.webp', 147, 149, 73, 74, 67.2],
  buttonNavyNight:   ['30_night/night_button_navy_01.webp', 151, 157, 79, 72.5, 95.3],
  mothProp:          ['30_night/night_moth_01.webp', 204, 157, 98, 77.5, 113.6],
  fillLavender1:     ['30_night/night_fill_lavender_01.webp', 161, 179, 80, 89, 105.6],
  fillLavender2:     ['30_night/night_fill_lavender_02.webp', 141, 200, 70, 99.5, 103.8],
  fillPebbleGrey:    ['30_night/night_fill_pebble_grey_01.webp', 135, 120, 67, 59.5, 59.8],
  fillPebbleCream:   ['30_night/night_fill_pebble_cream_01.webp', 128, 133, 63.5, 66, 66.4],
  fillStar:          ['30_night/night_fill_star_01.webp', 173, 172, 86, 86, 92.5],
  // 31_snow
  heroFirBig:       ['31_snow/snow_hero_fir_big_01.webp', 251, 255, 121.5, 127, 125.5],
  heroFirSmall:     ['31_snow/snow_hero_fir_small_01.webp', 166, 255, 81.5, 147.5, 85.5],
  heroBareTree:     ['31_snow/snow_hero_bare_tree_01.webp', 243, 232, 121.5, 115.5, 116.5],
  heroCottage1:     ['31_snow/snow_hero_cottage_01.webp', 217, 217, 108, 108, 121.4],
  heroCottage2:     ['31_snow/snow_hero_cottage_02.webp', 206, 214, 102.5, 106, 118.2],
  heroSled:         ['31_snow/snow_hero_sled_01.webp', 115, 170, 57, 84.5, 84.2],
  heroStarOrnament: ['31_snow/snow_hero_star_01.webp', 148, 172, 73.5, 85.5, 87],
  heroSpoolWhite:   ['31_snow/snow_hero_spool_white_01.webp', 101, 166, 50, 82.5, 76.6],
  snowPebbles:      ['31_snow/snow_pebbles_01.webp', 307, 175, 153, 87, 147.5],
  snowBerrySprig:   ['31_snow/snow_berry_sprig_01.webp', 251, 151, 125, 75, 133.4],
  snowFootprints:   ['31_snow/snow_footprints_01.webp', 351, 183, 175, 90.5, 170.4],
  tinselTangle:     ['31_snow/snow_tinsel_01.webp', 345, 179, 172, 89, 168.8],
  snowballProp:     ['31_snow/snow_snowball_01.webp', 139, 139, 69.5, 69, 62],
  icicleProp:       ['31_snow/snow_icicle_01.webp', 61, 169, 30, 84, 76],
  baubleRed:        ['31_snow/snow_bauble_red_01.webp', 128, 165, 63.5, 82, 74.1],
  baubleBlue:       ['31_snow/snow_bauble_blue_01.webp', 127, 164, 63, 81.5, 73.7],
  candyCane:        ['31_snow/snow_candy_cane_01.webp', 106, 173, 52.5, 86, 81.4],
  bell:             ['31_snow/snow_bell_01.webp', 125, 154, 62, 76.5, 78.8],
  pineSprig:        ['31_snow/snow_pine_sprig_01.webp', 219, 158, 109, 78.5, 120.1],
  buttonWhite:      ['31_snow/snow_button_white_01.webp', 124, 123, 61.5, 61, 53.8],
  fillSnow1:        ['31_snow/snow_fill_lump_01.webp', 182, 115, 90.5, 57, 82.8],
  fillSnow2:        ['31_snow/snow_fill_lump_02.webp', 133, 98, 66, 48.5, 58.1],
  fillSnowBerry:    ['31_snow/snow_fill_berry_01.webp', 80, 84, 39.5, 41.5, 34.3],
  fillStarGold:     ['31_snow/snow_fill_star_gold_01.webp', 105, 104, 52, 51.5, 50.9],
  fillStarSilver:   ['31_snow/snow_fill_star_silver_01.webp', 121, 116, 50, 63.5, 56],
};

// ======================= wanted art (art asked for but not delivered yet) =======================
// An entry made with want(file under assets/kit/, canvas w, h) registers a piece before its file exists, with a
// placeholder centre and radius. Nothing loads a wanted entry: artKey / isWanted (below) treat it as missing, so a
// zone paints with whatever has arrived, and STAND_IN names the delivered piece to draw meanwhile (none = left out:
// "stand-in until the sprites arrive"). When the file arrives, paste tools/kit-import.html's measured line into
// SPRITES above and it replaces the wanted one. Round 5 (wishlist sections 28 to 31) has all arrived, so both are empty.
// eslint-disable-next-line no-unused-vars
const want = (file, w, h) => [file, w, h, w / 2, h / 2, 0.47 * Math.max(w, h)];
const WANTED = {};
// Delivered pieces that stand in for wanted ones meanwhile (a wanted key not listed here is simply left out).
const STAND_IN = {};
for (const k in WANTED) if (!(k in SPRITES)) SPRITES[k] = WANTED[k];
// True while a key's art hasn't arrived (its SPRITES entry is still the wanted placeholder, or the key is unknown).
export const isWanted = key => !SPRITES[key] || SPRITES[key] === WANTED[key];
// The key to draw for `key`: itself once delivered, else its stand-in, else null (leave it out).
export function artKey(key) {
  for (let i = 0; key && i < 4; i++) { if (!isWanted(key)) return key; key = STAND_IN[key]; }
  return null;
}
// Every still-wanted file (key -> file under assets/kit/), for tools: what's to come and what each key's file is called.
export const wantedFiles = () => Object.fromEntries(Object.keys(WANTED).filter(isWanted).map(k => [k, WANTED[k][0]]));

// The heart pad for the workshop's HP: stage 0 = the zone's undamaged pad (baked into a generated plate), 1..4 = damaged.
// A zone whose pads haven't arrived gets the meadow's (artKey's stand-in).
export const heartPadKey = (zone, stage) => artKey(zone + (stage ? 'HeartPadDmg' + stage : 'HeartPad')) || 'meadow' + (stage ? 'HeartPadDmg' + stage : 'HeartPad');
// The zone's Pin pad / heart pad sprite key (kind 'Pin' or 'Heart'), the meadow's while the zone's own hasn't arrived.
export const padKey = (zone, kind) => artKey(zone + kind + 'Pad') || 'meadow' + kind + 'Pad';
export const HIT_BITS = ['puff1', 'puff2', 'puff3', 'threadEnd1', 'threadEnd2', 'threadEnd3', 'stitchBit1', 'stitchBit2'];

export const TEXTURES = {
  denim: 'textures/denim_ground_01.webp', meadow: 'textures/meadow_ground_01.webp', lair: 'textures/lair_ground_01.webp',
  roadFelt: 'textures/sewing_road_felt_01.webp', roadEdge: 'textures/sewing_road_edge_01.webp',
  patchRedPlaid: 'textures/sewing_patch_red_plaid_01.webp', patchBluePlaid: 'textures/sewing_patch_blue_plaid_01.webp',
  patchGingham: 'textures/sewing_patch_yellow_gingham_01.webp', patchPolka: 'textures/sewing_patch_polka_01.webp',
  // round 3: frame compartment floors, more road felt and ground tiles (assets/kit/18_frames .. 21_ground)
  meadowFrameFloor: '18_frames/meadow_frame_floor_01.webp', denimFrameFloor: '18_frames/denim_frame_floor_01.webp',
  lairFrameFloor: '18_frames/lair_frame_floor_01.webp',
  roadFelt2: '20_road/sewing_road_felt_02.webp', roadFelt3: '20_road/sewing_road_felt_03.webp',
  meadow2: '21_ground/meadow_ground_02.webp', meadow3: '21_ground/meadow_ground_03.webp',
  denim2: '21_ground/denim_ground_02.webp', denim3: '21_ground/denim_ground_03.webp',
  lair2: '21_ground/lair_ground_02.webp', lair3: '21_ground/lair_ground_03.webp',
  // round 5 ground tiles
  autumn: 'textures/autumn_ground_01.webp',
  autumn2: 'textures/autumn_ground_02.webp',
  autumn3: 'textures/autumn_ground_03.webp',
  night: 'textures/night_ground_01.webp',
  night2: 'textures/night_ground_02.webp',
  night3: 'textures/night_ground_03.webp',
  snow: 'textures/snow_ground_01.webp',
  snow2: 'textures/snow_ground_02.webp',
  snow3: 'textures/snow_ground_03.webp',
};
// Ground tiles still wanted (as WANTED above; none now). A zone whose tiles haven't arrived paints on its `standIn`
// zone's ground under its own colours (levelArt.js).
const WANTED_TEX = {};
for (const t in WANTED_TEX) if (!(t in TEXTURES)) TEXTURES[t] = WANTED_TEX[t];
export const texWanted = name => !TEXTURES[name] || TEXTURES[name] === WANTED_TEX[name];

// Prop entries: [sprite, weight, min scale, max scale, turn] (scale 0.5 = the plate size the sprite was drawn for, 1 = the
// file's full pixels, past which it blurs; turn = how far it may be rotated, in radians: 3.2 = any way, small = stays
// roughly upright). A zone places its props in three tiers (levelArt.js):
//   heroes   one to three big focal pieces per plate, out in the margins beside the road (they may hang off the edge)
//   clusters beds and heaps: a cluster kind is { w: weight, n: [min, max] members, spread: radius the members land in,
//            core: entries for one bigger piece in the middle (or none), members: entries for the rest }
//   singles  a few mid-size pieces on their own
const BUTTONS = ['buttonBlue', 'buttonWood', 'buttonRed', 'buttonNavy', 'buttonYellow', 'buttonPurple', 'buttonCream', 'buttonGreen'];
const each = (keys, w, a, b, turn) => keys.map(k => [k, w, a, b, turn]);
const FLOWERS = [['flowerPink', 1.2, 0.42, 0.55, 3.2], ['flowerBlue', 1.2, 0.42, 0.55, 3.2], ['flowerYellow', 1.2, 0.5, 0.62, 3.2],
  ['flowerCream', 1, 0.4, 0.52, 3.2], ['daisy', 0.8, 0.36, 0.46, 3.2]];
const BUSHES = each(['bush1', 'bush2', 'bush3'], 1, 0.58, 0.72, 3.2);
const SPOOLS = each(['spoolRed', 'spoolBlue', 'spoolGreen'], 1, 0.5, 0.62, 3.2);
const PINS = each(['pinRed', 'pinBlue', 'pinYellow'], 1, 0.6, 0.72, 3.2);
const SCRAPS = each(['scrapPlaid', 'scrapGingham', 'scrapDenim', 'scrapPolka'], 1, 0.42, 0.55, 0.7);
const BUTTON_SPILL = { w: 1, n: [5, 8], spread: 62, core: null, members: each(BUTTONS, 1, 0.3, 0.46, 3.2) };
// round 3 cluster sprites (assets/kit/21_ground, 22_denim): pre-composed beds and spills that anchor a cluster
const TUFTS = each(['grassTuft1', 'grassTuft2', 'grassTuft3'], 1, 0.46, 0.6, 3.2);
const FLOWER_BEDS = each(['flowerBed1', 'flowerBed2', 'flowerBed3'], 1, 0.46, 0.56, 0.4);
const RIVETS = each(['rivet1', 'rivet2', 'rivet3'], 1, 0.46, 0.56, 3.2);
const TACKS = each(['tackBrass', 'tackSilver'], 1, 0.46, 0.56, 3.2);
const PIN_SCATTER = { w: 0.8, n: [2, 4], spread: 72, core: [['pinScatter', 1, 0.46, 0.56, 3.2]], members: PINS };
const SPILL_HEAP = { w: 0.9, n: [2, 4], spread: 78, core: [['buttonSpill', 1, 0.46, 0.56, 3.2]], members: each(BUTTONS, 1, 0.3, 0.42, 3.2) };
// round 4 drawer junk (assets/kit/26_drawer_small): a coin-and-screw spill, a rubber band and twist tie tangle, and loose
// pieces for the singles. Every zone has some (the levels are all inside the drawer), weighted per zone below.
const COINS = [...each(['coin1', 'coin2'], 1, 0.46, 0.56, 3.2), ...each(['screw1', 'screw2', 'screw3'], 0.8, 0.46, 0.56, 3.2)];
const COIN_SPILL = { w: 0.6, n: [2, 4], spread: 82, core: [['coinSpill', 1, 0.46, 0.56, 3.2]], members: COINS };
const BAND_TANGLE = { w: 0.5, n: [1, 3], spread: 90, core: [['bandTangle', 1, 0.46, 0.56, 3.2]],
  members: [...each(['twistTie1', 'twistTie2'], 1, 0.46, 0.56, 3.2), ...each(['hairTie1', 'hairTie2'], 0.7, 0.46, 0.56, 3.2)] };
const JUNK = w => [...each(['paperclip1', 'paperclip2'], w, 0.46, 0.56, 3.2), ...each(['breadClip1', 'breadClip2'], w, 0.46, 0.56, 3.2),
  ...each(['bottleCap1', 'bottleCap2'], w, 0.46, 0.56, 3.2), ...each(['twistTie1', 'twistTie2'], w * 0.7, 0.46, 0.56, 3.2),
  ...each(['coin1', 'coin2'], w * 0.7, 0.46, 0.56, 3.2), ...each(['screw1', 'screw2', 'screw3'], w * 0.5, 0.46, 0.56, 3.2),
  ...each(['hairTie1', 'hairTie2'], w * 0.7, 0.46, 0.56, 3.2)];
// carpet: the tiniest pieces, packed into every patch of ground still bare after the fill pass (no shadow each, so
// hundreds stay cheap). The round 5 worlds' carpets are their wishlist "Fill" rows; the meadow (and any zone whose own
// carpet hasn't arrived) uses grass tufts and the small felt flowers drawn small.
const CARPET_MEADOW = [...each(['grassTuft1', 'grassTuft2', 'grassTuft3'], 1.6, 0.24, 0.34, 3.2), ['flowerYellow', 0.3, 0.24, 0.3, 3.2],
  ['flowerPink', 0.2, 0.2, 0.26, 3.2], ['flowerBlue', 0.2, 0.2, 0.26, 3.2], ['flowerCream', 0.15, 0.18, 0.24, 3.2], ['stoneS', 0.1, 0.18, 0.24, 3.2]];
export const CARPET_STAND_IN = CARPET_MEADOW;

const MEADOW = {
  heroes: [['treeL', 1.3, 0.86, 1.02, 3.2], ['treeM', 0.9, 1.02, 1.12, 3.2],
    ['stoneL', 0.3, 0.95, 1.08, 3.2], ['pincushion', 0.2, 0.85, 0.98, 3.2], ['yarnYellow', 0.2, 0.95, 1.05, 3.2]],
  // ground features, flat under everything (the duck pond lies here now, beside the round 5 ponds once they arrive)
  ponds: [['pond', 1, 0.5, 0.6, 0.2], ['pond1', 1, 0.95, 1.15, 0.4], ['pond2', 1, 0.95, 1.1, 0.4], ['pond3', 1, 0.95, 1.1, 0.4]],
  carpet: CARPET_MEADOW,
  clusters: [
    { w: 1.5, n: [2, 4], spread: 95, core: FLOWER_BEDS, members: [...FLOWERS, ...TUFTS] },
    { w: 0.8, n: [2, 4], spread: 85, core: [['mossMeadow', 1, 0.46, 0.56, 0.4]], members: [...TUFTS, ['flowerCream', 0.6, 0.4, 0.5, 3.2], ['stoneS', 0.5, 0.42, 0.52, 3.2]] },
    { w: 1, n: [4, 7], spread: 70, core: null, members: TUFTS },
    { ...SPILL_HEAP, w: 0.2 },
    { w: 0.8, n: [7, 11], spread: 80, core: null, members: FLOWERS },
    { w: 1.3, n: [4, 6], spread: 105, core: each(['bush1', 'bush2', 'bush3'], 1, 0.78, 0.9, 3.2), members: [...BUSHES, ...FLOWERS] },
    { w: 1.3, n: [3, 5], spread: 125, core: [['treeM', 1, 0.72, 0.82, 3.2], ['treeS', 1, 0.82, 0.92, 3.2]],
      members: [['treeS', 1.2, 0.56, 0.68, 3.2], ...BUSHES, ['stoneS', 0.5, 0.45, 0.55, 3.2], ['daisy', 0.6, 0.4, 0.5, 3.2]] },
    { w: 0.35, n: [2, 4], spread: 70, core: [['stoneL', 1, 0.62, 0.72, 3.2]], members: [['stoneS', 1, 0.42, 0.52, 3.2], ['stoneM', 0.8, 0.45, 0.55, 3.2], ['flowerYellow', 0.6, 0.5, 0.6, 3.2]] },
    { w: 0.6, n: [3, 5], spread: 64, core: null, members: [['sunflower', 1.4, 0.44, 0.58, 3.2], ['daisy', 1, 0.4, 0.5, 3.2]] },
    { ...BUTTON_SPILL, w: 0.25, n: [3, 5] },
    { ...COIN_SPILL, w: 0.2 }, { ...BAND_TANGLE, w: 0.15 },
  ],
  singles: [...each(['grassTuft1', 'grassTuft2', 'grassTuft3'], 0.7, 0.46, 0.6, 3.2), ['flowerBed2', 0.3, 0.46, 0.54, 0.4],
    ['treeS', 1, 0.6, 0.72, 3.2], ['bush2', 0.8, 0.6, 0.72, 3.2], ['stoneM', 0.3, 0.5, 0.6, 3.2],
    ['sunflower', 0.6, 0.48, 0.58, 3.2], ['daisy', 0.6, 0.42, 0.52, 3.2], ['spoolRed', 0.25, 0.46, 0.54, 3.2], ['thimble', 0.2, 0.44, 0.52, 3.2], ...JUNK(0.06)],
  // the painter's fill pass (bare ground left after the clusters): mostly bushes and small trees, as the painted plates
  fill: [...each(['bush1', 'bush2', 'bush3'], 1.3, 0.5, 0.68, 3.2), ['treeS', 1, 0.5, 0.66, 3.2], ...FLOWERS, ...TUFTS, ['stoneS', 0.4, 0.42, 0.52, 3.2], ['stoneM', 0.3, 0.42, 0.52, 3.2]],
};
const DENIM = {
  heroes: [['pincushion', 1.2, 0.9, 1.02, 3.2], ['tape', 1.1, 0.95, 1.06, 3.2], ['thimble', 0.7, 1.05, 1.15, 3.2],
    ['yarnTeal', 0.8, 1.0, 1.1, 3.2], ['yarnYellow', 0.8, 1.0, 1.1, 3.2], ['spoolRed', 0.5, 0.95, 1.05, 3.2], ['spoolBlue', 0.5, 0.95, 1.05, 3.2]],
  clusters: [
    { w: 1.2, n: [2, 4], spread: 95, core: each(['pocket1', 'pocket2'], 1, 0.46, 0.56, 0.35), members: [...RIVETS, ...TACKS] },
    { w: 0.8, n: [2, 4], spread: 85, core: each(['frayedHole1', 'frayedHole2'], 1, 0.46, 0.56, 3.2), members: [...RIVETS, ...each(['beltLoop1', 'beltLoop2'], 0.6, 0.46, 0.56, 0.5)] },
    SPILL_HEAP, PIN_SCATTER,
    { ...BUTTON_SPILL, w: 0.9 },
    { w: 1, n: [3, 5], spread: 58, core: [['pincushion', 1, 0.44, 0.52, 3.2]], members: [...PINS, ['safetyPin', 0.8, 0.4, 0.5, 3.2]] },
    { w: 1, n: [2, 4], spread: 72, core: null, members: [...SPOOLS, ['thimble', 0.9, 0.46, 0.54, 3.2]] },
    { w: 0.8, n: [3, 5], spread: 70, core: null, members: [...SCRAPS, ...each(BUTTONS, 0.3, 0.32, 0.42, 3.2)] },
    { w: 0.8, n: [3, 5], spread: 80, core: [['yarnTeal', 1, 0.55, 0.64, 3.2], ['yarnYellow', 1, 0.55, 0.64, 3.2]],
      members: [['chalk', 1, 0.45, 0.55, 3.2], ...PINS, ...each(BUTTONS, 0.3, 0.32, 0.42, 3.2)] },
    COIN_SPILL, BAND_TANGLE,
  ],
  singles: [['zipper', 0.5, 0.46, 0.56, 0.5], ['cuff', 0.4, 0.46, 0.56, 0.5], ...each(['beltLoop1', 'beltLoop2'], 0.4, 0.46, 0.56, 0.5),
    ...each(['tackBrass', 'tackSilver'], 0.5, 0.46, 0.56, 3.2), ...each(['rivet1', 'rivet2', 'rivet3'], 0.4, 0.46, 0.56, 3.2),
    ['thimble', 1, 0.46, 0.54, 3.2], ...each(['spoolRed', 'spoolBlue', 'spoolGreen'], 0.6, 0.5, 0.6, 3.2),
    ['safetyPin', 0.8, 0.45, 0.55, 3.2], ['chalk', 0.6, 0.45, 0.52, 3.2], ['tape', 0.5, 0.48, 0.56, 3.2], ...each(BUTTONS, 0.25, 0.36, 0.48, 3.2), ...JUNK(0.15)],
};
const LAIR = {
  heroes: [['lumpL', 1.2, 0.9, 1.02, 0.35], ['tangle1', 0.9, 1.0, 1.12, 3.2], ['tangle2', 0.9, 1.0, 1.12, 3.2],
    ['pincushionLair', 1, 0.9, 1.0, 3.2], ['lumpM', 0.6, 1.02, 1.12, 0.35]],
  clusters: [
    { w: 0.9, n: [2, 4], spread: 88, core: [['mossLair', 1, 0.46, 0.56, 0.4]], members: [['lantern', 0.6, 0.72, 0.85, 3.2], ['needle', 0.6, 0.45, 0.55, 3.2], ['lumpS', 0.8, 0.42, 0.52, 0.35]] },
    { ...PIN_SCATTER, members: each(['pinRed', 'pinBlue'], 1, 0.6, 0.72, 3.2) },
    { w: 0.7, n: [2, 4], spread: 100, core: [['lumpM', 1, 0.56, 0.66, 0.35]], members: [['lumpS', 1.4, 0.42, 0.52, 0.35], ['lantern', 0.4, 0.72, 0.85, 3.2]] },
    { w: 1.1, n: [3, 5], spread: 80, core: each(['tangle1', 'tangle2'], 1, 0.5, 0.6, 3.2),
      members: [['needle', 1, 0.45, 0.55, 3.2], ...each(['pinRed', 'pinBlue'], 0.6, 0.6, 0.72, 3.2), ...each(['buttonPurple', 'buttonNavy', 'buttonCream'], 0.5, 0.34, 0.44, 3.2)] },
    { w: 0.6, n: [2, 4], spread: 70, core: null, members: [['lantern', 1.5, 0.72, 0.88, 3.2], ['needle', 0.5, 0.45, 0.55, 3.2]] },
    { w: 0.9, n: [4, 6], spread: 62, core: null, members: [['needle', 1, 0.42, 0.52, 3.2], ['safetyPin', 0.7, 0.42, 0.5, 3.2], ...each(['pinRed', 'pinBlue', 'pinYellow'], 0.6, 0.6, 0.72, 3.2),
      ...each(['buttonPurple', 'buttonNavy'], 0.6, 0.32, 0.42, 3.2)] },
    { ...BUTTON_SPILL, w: 0.6, members: each(['buttonPurple', 'buttonNavy', 'buttonCream', 'buttonRed'], 1, 0.3, 0.44, 3.2) },
    { ...COIN_SPILL, w: 0.5 }, { ...BAND_TANGLE, w: 0.4 },
  ],
  singles: [['lumpS', 0.5, 0.5, 0.6, 0.35], ['lantern', 1, 0.75, 0.88, 3.2], ['needle', 0.7, 0.5, 0.6, 3.2],
    ['tangle2', 0.5, 0.45, 0.55, 3.2], ['pincushionLair', 0.4, 0.46, 0.52, 3.2], ['spoolBlue', 0.3, 0.45, 0.52, 3.2], ...JUNK(0.08)],
};
// Round 5 worlds (docs/worlds.md, wishlist sections 28 to 31). The art came at about a quarter of the wishlist's 2x
// size, so each entry's scale is set from the delivered pixels (plate size = file px x scale): heroes about 300 to 450
// plate wide (the small drawer junk less, so it doesn't blur), cluster cores 200 to 300, singles 50 to 90, carpet 20
// to 40. heroes = the big trees and drawer junk inside the tray walls, clusters = the cluster sprites as cores,
// singles, carpet = the wishlist's "Fill" row (the night's lavender sprigs came sprig-sized: they're singles there).
const AUTUMN_SINGLES = [...each(['pineCone', 'acorn'], 1, 0.4, 0.5, 3.2), ['twig', 0.8, 0.38, 0.46, 3.2], ...each(['toadstool', 'pumpkinSmall'], 0.35, 0.4, 0.52, 3.2),
  ...each(['leafGold', 'leafRed'], 1.2, 0.4, 0.55, 3.2), ['buttonRust', 0.6, 0.4, 0.52, 3.2]];
const AUTUMN = {
  heroes: [['heroMapleRed', 1.4, 0.56, 0.68, 3.2], ['heroMapleGold', 1.4, 0.56, 0.68, 3.2], ['heroPumpkinOrange', 0.6, 0.95, 1.15, 3.2],
    ['heroPumpkinGreen', 0.4, 0.95, 1.15, 3.2], ['heroTwine', 0.4, 1.3, 1.5, 3.2], ['heroCopperMug', 0.4, 1.3, 1.5, 3.2]],
  ponds: [],
  clusters: [
    { w: 1.3, n: [3, 5], spread: 90, core: [['leafDrift', 1, 0.75, 0.95, 3.2]], members: AUTUMN_SINGLES },
    { w: 1, n: [2, 4], spread: 80, core: [['pineConePile', 1, 0.75, 0.95, 3.2]], members: [...each(['pineCone', 'acorn'], 1, 0.4, 0.5, 3.2), ['twig', 0.6, 0.38, 0.46, 3.2]] },
    { w: 1, n: [2, 4], spread: 80, core: [['berryBunch', 1, 0.75, 0.95, 3.2]], members: [...each(['leafRed', 'leafGold'], 1, 0.4, 0.52, 3.2), ['buttonRust', 0.5, 0.4, 0.5, 3.2]] },
    { w: 0.9, n: [2, 3], spread: 75, core: [['toadstoolPair', 1, 0.85, 1.05, 0.5]], members: [['toadstool', 0.5, 0.4, 0.5, 3.2], ['leafGold', 1, 0.4, 0.5, 3.2]] },
    { w: 0.7, n: [3, 5], spread: 95, core: [['heroPumpkinOrange', 1, 0.75, 0.9, 3.2]], members: [['pumpkinSmall', 1.4, 0.45, 0.6, 3.2], ...each(['leafGoldBig', 'leafRedBig'], 1, 0.4, 0.5, 3.2)] },
    { ...COIN_SPILL, w: 0.12 },
  ],
  singles: [...AUTUMN_SINGLES, ...each(['leafGoldBig', 'leafRedBig'], 0.6, 0.45, 0.6, 3.2), ...JUNK(0.04)],
  carpet: [...each(['fillLeafGold', 'fillLeafOrange', 'fillLeafRed'], 1.4, 0.3, 0.44, 3.2), ['fillSeed', 0.6, 0.28, 0.36, 3.2], ['fillBerry', 0.6, 0.3, 0.4, 3.2]],
};
const NIGHT_SINGLES = [...each(['marble', 'bottleCap', 'toadstoolNight', 'buttonNavyNight'], 1, 0.38, 0.52, 3.2), ...each(['paperclip', 'keySmall'], 0.8, 0.42, 0.52, 3.2),
  ['pebble', 1, 0.42, 0.55, 3.2], ['mothProp', 0.6, 0.36, 0.46, 3.2], ...each(['fillLavender1', 'fillLavender2'], 1.6, 0.4, 0.55, 3.2)];
const NIGHT = {
  heroes: [['heroLavenderBig', 1.5, 1.2, 1.5, 3.2], ['heroLavenderSmall', 1.2, 1.05, 1.3, 3.2], ['heroBrassKey', 0.4, 1.0, 1.2, 1.2],
    ['heroPencil', 0.4, 1.0, 1.2, 1.2], ['heroCookieCutter', 0.35, 1.0, 1.2, 3.2], ['heroMoon', 0.35, 0.95, 1.1, 3.2]],
  ponds: [],
  clusters: [
    { w: 1.4, n: [3, 5], spread: 90, core: [['lavenderBed', 1, 0.7, 0.9, 0.5]], members: [...each(['fillLavender1', 'fillLavender2'], 1.5, 0.4, 0.55, 3.2), ['toadstoolNight', 0.6, 0.38, 0.5, 3.2], ['mothProp', 0.3, 0.36, 0.44, 3.2]] },
    { w: 1, n: [2, 4], spread: 80, core: [['berrySprig', 1, 0.8, 1.0, 3.2]], members: [['pebble', 1, 0.42, 0.55, 3.2], ['buttonNavyNight', 0.6, 0.38, 0.5, 3.2]] },
    { w: 0.9, n: [2, 4], spread: 80, core: [['pebblePile', 1, 0.75, 0.95, 3.2]], members: [['pebble', 1, 0.42, 0.55, 3.2], ['marble', 0.6, 0.38, 0.5, 3.2]] },
    { w: 0.8, n: [1, 3], spread: 70, core: [['lanternBig', 1, 0.5, 0.6, 0.3]], members: [['lanternSmall', 1, 0.5, 0.6, 0.3], ['pebble', 1, 0.42, 0.55, 3.2]] },
    { ...BAND_TANGLE, w: 0.25 }, { ...COIN_SPILL, w: 0.15 },
  ],
  singles: [...NIGHT_SINGLES, ['lanternSmall', 0.7, 0.5, 0.6, 0.3], ...JUNK(0.08)],
  // the night's carpet: pebbles and stitched stars, with small purple and blue felt flowers
  carpet: [...each(['fillLavender1', 'fillLavender2'], 1, 0.16, 0.22, 3.2), ...each(['fillPebbleGrey', 'fillPebbleCream'], 0.45, 0.15, 0.22, 3.2), ['fillStar', 0.5, 0.13, 0.18, 3.2],
    ['flowerBlue', 0.5, 0.22, 0.3, 3.2], ['buttonPurple', 0.15, 0.16, 0.2, 3.2], ...each(['grassTuft1', 'grassTuft2', 'grassTuft3'], 0.7, 0.24, 0.32, 3.2)],
};
const SNOW_SINGLES = [...each(['snowballProp', 'bell', 'buttonWhite'], 1, 0.4, 0.55, 3.2), ...each(['baubleRed', 'baubleBlue'], 0.45, 0.4, 0.52, 3.2), ...each(['icicleProp', 'candyCane'], 0.8, 0.4, 0.52, 3.2),
  ['pineSprig', 1, 0.36, 0.46, 3.2]];
const SNOW = {
  heroes: [['heroFirBig', 1.5, 1.2, 1.5, 3.2], ['heroFirSmall', 1.3, 1.1, 1.35, 3.2], ['heroBareTree', 1, 1.2, 1.45, 3.2],
    ['heroCottage1', 0.7, 1.3, 1.55, 0.3], ['heroCottage2', 0.7, 1.3, 1.55, 0.3], ['heroSled', 0.3, 1.2, 1.4, 1.2], ['heroStarOrnament', 0.3, 1.1, 1.3, 3.2]],
  ponds: [['pond1', 1, 0.95, 1.15, 0.4], ['pond2', 1, 0.95, 1.1, 0.4], ['pond3', 1, 0.95, 1.1, 0.4]],
  clusters: [
    { w: 1.2, n: [2, 4], spread: 85, core: [['snowPebbles', 1, 0.7, 0.9, 3.2]], members: each(['snowballProp', 'buttonWhite'], 1, 0.4, 0.52, 3.2) },
    { w: 1, n: [2, 4], spread: 80, core: [['snowBerrySprig', 1, 0.8, 1.0, 3.2]], members: [['pineSprig', 1, 0.36, 0.46, 3.2], ['baubleRed', 0.8, 0.4, 0.52, 3.2]] },
    { w: 0.9, n: [1, 3], spread: 80, core: [['snowFootprints', 1, 0.65, 0.8, 0.6]], members: each(['snowballProp', 'icicleProp'], 1, 0.4, 0.52, 3.2) },
    { w: 0.8, n: [2, 4], spread: 80, core: [['tinselTangle', 1, 0.65, 0.8, 3.2]], members: each(['baubleRed', 'baubleBlue', 'bell', 'candyCane'], 1, 0.4, 0.52, 3.2) },
  ],
  singles: [...SNOW_SINGLES, ...JUNK(0.03)],
  carpet: [['fillSnow1', 1.2, 0.15, 0.22, 3.2], ['fillSnow2', 1.2, 0.2, 0.28, 3.2], ['fillSnowBerry', 0.3, 0.3, 0.4, 3.2],
    ['fillStarGold', 0.4, 0.25, 0.34, 3.2], ['fillStarSilver', 0.4, 0.22, 0.32, 3.2]],
};
// Lit things: a prop whose key is here shines (levelArt.js lays its glow under it and lists it in the level's `lights`
// for the night world's dark). r = the light's radius in multiples of the sprite's visible radius at the scale drawn
// (times CONFIG.levelGen.lightScale), glow = the additive glow sprite laid under it.
export const LIGHTS = {
  lanternLit1: { r: 4.5, glow: 'lanternGlow' }, lanternLit2: { r: 4.5, glow: 'lanternGlow' }, lantern: { r: 4, glow: 'lanternGlow' },
  lanternBig: { r: 2.6, glow: 'lanternGlow' }, lanternSmall: { r: 3, glow: 'lanternGlow' }, heroCopperMug: { r: 1.4, glow: 'lanternGlow' },
  heroCottage1: { r: 1.3, glow: 'windowGlow' }, heroCottage2: { r: 1.3, glow: 'windowGlow' },
};

// Per zone (a level file's `world`): ground texture, whether the ground is a quilt (irregular squares of it, each turned
// its own way, with seams), whether the ground may be laid again turned a quarter to hide the tile's repeat (false: only
// mirrored, so grass stays upright), the road's stitch colour, which patch fabrics lie on the ground, the props (above),
// and the zone's colours: a warm `tint` and a deep `shade`, for the ground's washes and the colour grade over the
// finished plate (light from the top left, the far corner sinking into the shade).
// Round 3 (assets/kit/18_frames .. 22_denim): the frame round the plate (src/levelFrame.js), the road kit (src/roadKit.js),
// more ground and road felt tiles, and the hero props that sit in the frame's compartments.
// Round 5: `tray` (a sewing-tray world: 3 to 4 big heroes leaning over the wall, continuous fences), props.ponds (flat
// ground features), props.carpet (the tiny pieces packed into bare ground), river, roadLanterns, standIn / standInWash,
// and roadKit.padRing / roadKit.flags (the fence ring round a Pin pad, the heart pad's two flag posts).
// frame: rim strips (variants), the thinner divider strip, corner pieces, the end cap where a road passes through, the
// T-joint, and the compartment floor texture. Strips are drawn horizontal with their bottom long edge facing the play area.
const frameOf = z => ({ rim: [z + 'FrameRim1', z + 'FrameRim2'], divider: z + 'FrameDivider', outerCorner: z + 'FrameOuterCorner',
  innerCorner: z + 'FrameInnerCorner', cap: z + 'FrameCap', tee: z + 'FrameT', floor: z + 'FrameFloor' });
// roadKit: what lines the road's edges (meadow: fence posts joined by rope links or rails; denim and lair: edge strips
// sliced along the road, bottom edge toward the road) and the decals that lie on the felt (every zone).
const ROAD_DECALS = { darns: ['roadDarn1', 'roadDarn2'], boots: ['bootL', 'bootR'], pins: ['roadPin1', 'roadPin2'], arrow: 'chalkArrow' };
const FRAME_HEROES = {
  meadow: [['heroSpoolRed', 1, 0.5, 0.56, 0.4], ['heroSpoolBlue', 1, 0.5, 0.56, 0.4], ['heroSpoolGreen', 0.8, 0.5, 0.56, 3.2], ['heroSpoolYellow', 0.8, 0.5, 0.56, 3.2],
    ['heroButtonJar', 1, 0.5, 0.56, 3.2], ['heroPincushion', 1, 0.5, 0.56, 3.2], ['heroFabricBlue', 0.9, 0.5, 0.56, 0.3], ['heroFabricGingham', 0.9, 0.5, 0.56, 0.3],
    ['heroYarnNeedles', 0.9, 0.5, 0.56, 3.2]],
  denim: [['heroTape', 1, 0.5, 0.56, 3.2], ['heroButtonTin', 1, 0.5, 0.56, 3.2], ['heroDenimBolt', 0.9, 0.5, 0.56, 0.4], ['heroSpoolBox', 1, 0.5, 0.56, 0.3],
    ['heroThimble', 0.8, 0.5, 0.56, 3.2], ['heroPincushion', 0.6, 0.5, 0.56, 3.2], ['heroSpoolRed', 0.5, 0.5, 0.56, 0.4]],
  lair: [['heroSeamRipper', 1, 0.5, 0.56, 0.6], ['heroPincushionLair', 1, 0.5, 0.56, 3.2], ['heroDarningMushroom', 0.9, 0.5, 0.56, 3.2],
    ['heroBobbinTangle', 1, 0.5, 0.56, 3.2], ['heroDoily', 0.8, 0.5, 0.56, 3.2]],
};
// the round 5 tray worlds share the sewing tray's compartments, each with some of its own drawer's junk in them
// (the refs: rubber bands and a battery in the kitchen drawer, keys and bands by the bed, the battery in the holiday box)
FRAME_HEROES.autumn = [...FRAME_HEROES.meadow, ['heroBandTan', 0.7, 0.42, 0.48, 3.2], ['heroBattery', 0.5, 0.5, 0.56, 0.4],
  ['heroHoneyDipper', 0.9, 1.5, 1.7, 0.6], ['heroBottleOpener', 0.7, 1.4, 1.6, 3.2]];
FRAME_HEROES.night = [...FRAME_HEROES.meadow.filter(e => e[0] !== 'heroFabricGingham'), ['heroKey', 0.9, 0.5, 0.56, 0.5],
  ['heroBandRed', 0.7, 0.42, 0.48, 3.2], ['heroBandTan', 0.5, 0.42, 0.48, 3.2], ['heroClothespin', 0.8, 1.4, 1.6, 0.6], ['heroSpoon', 0.7, 1.3, 1.5, 0.6]];
FRAME_HEROES.snow = [...FRAME_HEROES.meadow, ['heroBattery', 0.6, 0.5, 0.56, 0.4], ['heroSpoolWhite', 0.9, 1.7, 1.9, 0.6]];
// the shared tray's fence; the holiday box's posts and rails wear snow caps (the meadow's stand in until they arrive)
const TRAY_FENCE = { posts: ['fencePost1', 'fencePost2', 'fencePost3'], links: ['ropeLink1', 'ropeLink2'], rails: ['fenceRail1', 'fenceRail2'] };
const SNOW_FENCE = { posts: ['snowPost1', 'snowPost2', 'snowPost3'], links: [], rails: ['snowRail1', 'snowRail2'] };
const TRAY_EXTRAS = { padRing: 'padRing', flags: ['flagPostL', 'flagPostR'] };
export const ZONES = {
  meadow: { ground: 'meadow', grounds: ['meadow', 'meadow2', 'meadow3'], seams: false, groundTurn: false, stitch: '#6e4524', patches: ['patchGingham', 'patchRedPlaid'], props: MEADOW,
    tint: '#ffd98a', shade: '#08331c', frame: frameOf('meadow'), frameHeroes: FRAME_HEROES.meadow, tray: true,
    // (no padRing: the meadow's Pin pad has its own fence)
    roadKit: { ...TRAY_FENCE, strips: [], decals: ROAD_DECALS, padRing: null, flags: TRAY_EXTRAS.flags } },
  denim:  { ground: 'denim', grounds: ['denim', 'denim2', 'denim3'], seams: true, groundTurn: true, stitch: '#6e4524', patches: ['patchRedPlaid', 'patchBluePlaid', 'patchGingham', 'patchPolka'], props: DENIM,
    tint: '#ffcf8a', shade: '#021a2a', frame: frameOf('denim'), frameHeroes: FRAME_HEROES.denim,
    roadKit: { posts: [], links: [], rails: [], strips: ['denimSelvage', 'denimFrayed'], decals: ROAD_DECALS } },
  lair:   { ground: 'lair', grounds: ['lair', 'lair2', 'lair3'], seams: false, groundTurn: true, stitch: '#4a2a50', patches: ['patchBluePlaid', 'patchPolka'], props: LAIR,
    tint: '#d9a0ff', shade: '#12031c', frame: frameOf('lair'), frameHeroes: FRAME_HEROES.lair,
    roadKit: { posts: [], links: [], rails: [], strips: ['lairPinned1', 'lairPinned2'], decals: ROAD_DECALS } },
  // Round 5 tray worlds: the shared tray (meadow frame; snow-capped rims and caps for the holiday box), the shared fence,
  // their own ground, props, pads and light. Until a world's ground tiles arrive it paints on its standIn zone's ground
  // under its own colours plus standInWash ([css colour, alpha, blend] over the ground), with the meadow's pads. river =
  // the satin river's colour ('brown' / 'blue', levelArt.js), roadLanterns = lanterns along the road (the dark world).
  autumn: { ground: 'autumn', grounds: ['autumn', 'autumn2', 'autumn3'], standIn: 'meadow', standInWash: ['#b8561c', 0.5, 'color'],
    seams: false, groundTurn: true, stitch: '#6a3a1a', patches: ['patchRedPlaid', 'patchGingham'], props: AUTUMN,
    tint: '#ffc069', shade: '#2a1206', frame: frameOf('meadow'), frameHeroes: FRAME_HEROES.autumn, tray: true, river: 'brown',
    roadKit: { ...TRAY_FENCE, strips: [], decals: ROAD_DECALS, ...TRAY_EXTRAS } },
  night:  { ground: 'night', grounds: ['night', 'night2', 'night3'], standIn: 'meadow', standInWash: ['#2a2f78', 0.62, 'multiply'],
    seams: false, groundTurn: true, stitch: '#5a3420', patches: ['patchBluePlaid', 'patchPolka'], props: NIGHT,
    tint: '#c9b8ff', shade: '#060a24', frame: frameOf('meadow'), frameHeroes: FRAME_HEROES.night, tray: true, river: 'blue', roadLanterns: true,
    roadKit: { ...TRAY_FENCE, strips: [], decals: ROAD_DECALS, ...TRAY_EXTRAS } },
  snow:   { ground: 'snow', grounds: ['snow', 'snow2', 'snow3'], standIn: 'meadow', standInWash: ['#eef3ff', 0.72, 'source-over'],
    seams: false, groundTurn: true, stitch: '#6e4524', patches: ['patchBluePlaid', 'patchRedPlaid'], props: SNOW,
    tint: '#e6f0ff', shade: '#1c2c4a', frame: { ...frameOf('meadow'), rim: ['snowFrameRim1', 'snowFrameRim2'], cap: 'snowFrameCap' },
    frameHeroes: FRAME_HEROES.snow, tray: true, river: 'blue',
    roadKit: { ...SNOW_FENCE, strips: [], decals: ROAD_DECALS, ...TRAY_EXTRAS } },
};
// True once a zone's own look has arrived (its ground tile and both pads), so it may be drawn for a random road.
export const zoneReady = zone => !!ZONES[zone] && !texWanted(ZONES[zone].ground) && !isWanted(zone + 'PinPad') && !isWanted(zone + 'HeartPad');
// The zone a Random Quilt run paints in, from its seed: any zone whose art is in (zoneReady), else the original three.
export function randomZone(seed) {
  const ready = Object.keys(ZONES).filter(zoneReady);
  return ready[(seed >>> 0) % ready.length];
}
export const ROAD_FELTS = ['roadFelt', 'roadFelt2', 'roadFelt3'];   // the road felt tiles a plate picks from by seed
// Strips delivered with rounded, non-seamless ends: this share of their length is left off each end when they're tiled
// (levelFrame.js; the river strips are trimmed by CONFIG.levelGen.riverTrim).
export const STRIP_TRIM = { snowFrameRim1: 0.035, snowFrameRim2: 0.035 };

// Round-2 UI and character art (assets/kit/NN_section/), addressed by short name. uiImage(name) loads each once and
// returns the <img> (its .complete tells whether it has decoded yet); DOM code uses uiUrl(name) in CSS/src.
export const UI_ART = {
  silverfish: [1, 2, 3, 4].map(n => '10_characters/sewing_silverfish_walk_0' + n + '.png'),   // 240x120, faces right
  splat: ['10_characters/sewing_silverfish_splat_01.png', '10_characters/sewing_silverfish_splat_02.png'],   // 200x200
  gloveUp: '10_characters/ui_tutorial_glove_up.png', glovePress: '10_characters/ui_tutorial_glove_pressing.png',   // 300x360, one wrist anchor
  heart: '07_icons/ui_icon_heart_full_01.png', heartCracked: '07_icons/ui_icon_heart_cracked_01.png',
  check: '06_markers/ui_check_badge_01.png', lock: '06_markers/ui_lock_badge_01.png', here: '06_markers/ui_you_are_here_01.png',
  button: '03_currency/ui_currency_button_01.png',
  portraits: { seamRipper: '11_portraits/lair_seam_ripper_portrait_01.png', bruteKing: '11_portraits/lair_brute_king_portrait_01.png',
               unstitcher: '11_portraits/lair_unstitcher_portrait_01.png',
               twine: '11_portraits/autumn_twine_ball_portrait_01.webp', honeydipper: '11_portraits/autumn_honey_dipper_portrait_01.webp',
               skeletonkey: '11_portraits/night_skeleton_key_portrait_01.webp', bottlecap: '11_portraits/night_bottle_cap_portrait_01.webp',
               snowglobe: '11_portraits/snow_snow_globe_portrait_01.webp', bobbin: '11_portraits/meadow_bobbin_portrait_01.webp',
               zipper: '11_portraits/denim_zipper_portrait_01.webp' },   // 600x600, by boss key
  // achievement id -> badge (08_trophies/ui_achievement_<name>.png); anything unlisted keeps the trophy emoji. List only
  // badges that exist (shop.js shows a listed one as an <img>, so a missing file is a broken image, not the emoji).
  // Wanted, not drawn yet: clear-autumn drawer_swept, clear-night lights_out, stars-autumn golden_harvest,
  // stars-night golden_hour. The snow world borrows the old Lair's badges.
  achievements: { snip6: 'half_dozen', snip10: 'tailors_ten', 'boss-no-needle': 'no_needles_needed', 'one-pin': 'one_trick',
    'no-pins': 'bare_blades', 'cigar-beetle': 'cigar_cut', 'pruner-bite': 'ratchet_bite', 'squish-level': 'pest_control',
    'squish-25': 'silverfish_squasher', 'clear-meadow': 'meadow_mended', 'clear-denim': 'denim_darned', 'clear-lair': 'lair_unravelled',
    'stars-meadow': 'golden_meadow', 'stars-denim': 'golden_denim', 'stars-lair': 'golden_lair', 'beat-l12': 'the_quilt_is_safe',
    'clear-snow': 'lair_unravelled', 'stars-snow': 'golden_lair' },
  achievementLocked: '08_trophies/ui_achievement_locked_blank.png',
  // cosmetic id -> swatch (08_trophies/ui_swatch_<name>_01.png)
  swatches: { brassHandles: 'brass', roseHandles: 'rose', emberGlow: 'ember', frostGlow: 'frost', cloverHandles: 'clover', indigoGlow: 'indigo', ripperGlow: 'ripper' },
};
export const achievementArt = id => UI_ART.achievements[id] ? '08_trophies/ui_achievement_' + UI_ART.achievements[id] + '.png' : '';
export const swatchArt = id => UI_ART.swatches[id] ? '08_trophies/ui_swatch_' + UI_ART.swatches[id] + '_01.png' : '';
const uiImgs = {};
export const uiUrl = file => KIT_DIR + file;
export function uiImage(file) {
  if (!uiImgs[file]) { const i = new Image(); i.src = KIT_DIR + file; uiImgs[file] = i; }
  return uiImgs[file];
}

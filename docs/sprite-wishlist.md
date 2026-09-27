# Sprite wishlist for the level generator

Art for `src/levelArt.js` to paint generated levels with, in place of what it currently draws in code. The level
plates are 941 × 1672 px ("plate px") and show at about 1:1 on a phone, so everything below is asked for at
**2× its plate size** so it stays sharp.

## Rules for every file

| | |
|---|---|
| **Camera** | Straight top-down (orthographic, 90°), like `assets/level2-bg.webp`. No tilt or perspective: the road is drawn flat from above, so anything seen at an angle looks wrong on it. |
| **Style** | Felt, denim and stitched fabric, matching Button Fork. Attach `assets/level2-bg.webp` as the style reference. |
| **Light** | Soft, from the top-left. **No shadows** (cast or drop): I add those in code so everything matches. |
| **File type** | PNG-32 with transparency (preferred), or WebP with alpha. sRGB. |
| **Background** | Transparent. If the generator can't do that: a flat **#FF00FF magenta**, with no magenta or pink in the objects and no glow or haze bleeding into the background. |
| **Spacing** | On a sheet, at least 40 px of empty background between objects, and none touching the edge. |
| **Edges** | Clean cut-outs with no white or coloured halo. A little felt fuzz on the outline is fine. |
| **Naming** | `zone_item_variant.png`, e.g. `sewing_button_blue_01.png`. Zones: `sewing` (works everywhere), `meadow`, `denim`, `lair`. |
| **Sheets vs single files** | Either works. With sheets, one sheet per section below. I'll cut them apart and measure each object's footprint myself. |

**Priority:** P1 makes the biggest difference; P2 is nice to have.

## 1. Fixed level pieces (P1)

One of each; per-zone variants are P2.

| Item | Plate size | Deliver at | Notes |
|---|---|---|---|
| Pin pad (empty) | ⌀ 168 | 340 × 340 | A round felt patch with a dashed stitched ring, like Button Fork's beige pads. A Pin stands on it, so keep the middle plain. |
| Heart-pad workshop | ⌀ 224 | 460 × 460 | A red felt circle with a stitched ring and a cream heart, like the one at the bottom of Button Fork. |
| Fork centrepiece | ⌀ 300–360 | 720 × 720 | A big wooden button on a navy denim ring with a running stitch, like Button Fork's middle. It gets scaled to fit inside each fork. |

## 2. Seamless textures (P1 for denim, P2 for the other zones)

**1024 × 1024**, tiling on both axes. Flat, even lighting: no vignette, no gradient, no objects, no quilt seams (I draw the seams).

| Texture | Zones | Notes |
|---|---|---|
| Ground: denim | denim, sewing | Teal denim twill, like Button Fork's background. |
| Ground: felt grass | meadow | Green felt with tiny stitched grass tufts, top-down. |
| Ground: velvet | lair | Deep purple crushed velvet. |
| Road felt | all | Plain beige felt or canvas weave, like Button Fork's road, with no stitching (I draw that). |
| Road edge | all | Brown suede or leather, 512 × 512 is enough. |
| Patch fabrics, ×4 | all | Red plaid, blue plaid, yellow gingham, polka dot; 512 × 512 each. These fill the pinked-edge patches I cut. |

## 3. Sewing props (P1; used in every zone)

| Item | Count | Plate size | Deliver at |
|---|---|---|---|
| Buttons: wood, blue, red, navy, yellow, purple, cream, green (mix of 2-hole and 4-hole) | 8 | ⌀ 40–70 | 140 × 140 |
| Brass thimble, seen from above (a ring with a dimpled top) | 1 | ⌀ 110 | 220 × 220 |
| Thread spools seen from above (wooden flange around coloured thread): red, blue, green | 3 | ⌀ 120 | 240 × 240 |
| Tomato pin cushion with a few pins in it | 1 | ⌀ 200 | 400 × 400 |
| Safety pin | 1 | 160 × 60 | 320 × 120 |
| Loose sewing pins with round coloured heads | 3 | 100 × 16 | 200 × 32 |
| Coiled measuring tape | 1 | ⌀ 180 | 360 × 360 |
| Yarn ball | 2 | ⌀ 120 | 240 × 240 |
| Tailor's chalk | 1 | 100 × 60 | 200 × 120 |
| Fabric scraps with pinked edges (plaid, gingham, denim, polka) | 4 | 200 × 160 | 400 × 320 |

## 4. Meadow props (P2)

| Item | Count | Plate size | Deliver at |
|---|---|---|---|
| Felt tree seen from above (round canopy, stitched stars) | 3 sizes | ⌀ 140 / 180 / 220 | 280 / 360 / 440 |
| Felt bush | 3 | ⌀ 100 | 200 × 200 |
| Felt flowers: daisy, sunflower, small pink/blue/yellow | 6 | ⌀ 40–80 | 80–160 |
| Felt stones | 3 | ⌀ 70–120 | 140–240 |
| Blue felt pond with a duck appliqué | 1 | 300 × 200 | 600 × 400 |

## 5. Lair props (P2)

| Item | Count | Plate size | Deliver at |
|---|---|---|---|
| Dark felt lump with two glowing red button eyes | 3 | ⌀ 120–200 | 240–400 |
| Tangled black thread (thorny, spiky) | 2 | ⌀ 160 | 320 × 320 |
| Purple pin cushion bristling with pins | 1 | ⌀ 180 | 360 × 360 |
| Small lantern, seen from above | 1 | ⌀ 60 | 120 × 120 |
| Broken needle | 1 | 140 × 20 | 280 × 40 |

## 6. Map extras (P2)

| Item | Count | Size | Notes |
|---|---|---|---|
| Star rating: gold felt star, and the same star as an empty stitched outline | 2 | 96 × 96 | To show each level's 0–3 stars on the map (the stars are already recorded). |

## Prompt to copy (one sheet per section)

> Sprite sheet, straight top-down orthographic view, felt and fabric craft style matching the attached image, soft
> light from the top-left, no shadows, objects spaced well apart on a flat #FF00FF magenta background, no magenta in
> the objects: **[paste one section's list here]**

For textures:

> Seamless tileable texture, 1024×1024, top-down, flat even lighting, no vignette, no objects: **[texture]**, felt
> craft style matching the attached image.

Drop the files anywhere in the project (e.g. `assets/kit/incoming/`) and tell me. I'll cut them out, convert them
to WebP, measure their footprints and wire them into the painter.

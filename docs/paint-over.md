# Painting over the generated map levels

The map's recipe levels (0 and 3 to 13) are drawn at run time by the level generator. Painting over each one brings it up to the hand-painted quality of Meadow Road and Button Fork. The game logic does not change. Enemies follow the same routes and Pins stand on the same pads, so only the picture is replaced.

## The references

`docs/paint-refs/` holds two images per level (git ignores that folder; re-export them as below if it's missing):

- `NN-id.png` is the generated plate, the starting point to paint over.
- `NN-id-guide.png` is the same plate with what must not move marked: the road band in pink, each Pin pad as a pink circle, the heart pad as a yellow circle.

All of them are 941 x 1672 (a pixel either way on the bigger levels), the same as the painted plates. Bigger levels are shown zoomed out, so this size matches their on-screen detail too.

## Rules for the painting

1. **Keep the road where it is, at the same width.** Edges can be softened and restitched, but the felt must cover the pink band and not stray much past it. Enemies walk the centreline.
2. **Keep every pad and the heart pad at the same centre and size.** Pins are drawn on the pads, and the game draws the zone's own heart pad over the painted one.
3. **Keep the canvas size and framing.** Narrow phones crop roughly 80 px off each side, so nothing important goes there.
4. **Keep the top-left corner and the strip below the heart pad quiet.** The HUD and the action bar sit over them.
5. **Everything else is free:** props, trees, frame, lighting, fabric. Denser and richer is the point. Keep the world's look (meadow, denim, autumn, night or snow; lair for Endless). A generated plate in a river world (autumn, night, snow) may have a river crossing the road under a ruler bridge; keep the crossing where it is or paint the road over it, never move the road.
6. **No scissors or blades in the art.** Players would mistake them for weapons.
7. **The night world's lights come from the generated plate, not the painting.** The game darkens a night level outside the light sources the painter lists (`level().lights`: its lanterns and lit props). A painted-over night level (`bg`) has none, so paint lanterns only where the generated plate had them, or leave the level unpainted.

## Putting a painting in the game

1. Save it as WebP (about 85% quality) in `assets/levels/`, for example `assets/levels/03-hem.webp`. `tools/kit-import.html` can encode WebP in the browser if no image tool is to hand.
2. Add `bg` to the level file next to its recipe:
   ```js
   recipe: 'size 1.1, s left, fork pin, entry right 30', seed: 3,
   bg: 'assets/levels/03-hem.webp',
   ```
3. Play the level and check that enemies stay on the painted road and Pins sit on the pads.

If the file is missing or fails to load, the game logs a warning and shows the generated plate, so a level never goes blank.

**Changing a painted level's recipe or seed moves the road.** Remove its `bg` first, re-export, and paint again.

## Re-exporting the references

Run the dev server, open the game, and in the browser console:

```js
const { paintLevel, loadKit } = await import('/src/levelArt.js');
const L = await import('/src/levels/index.js');
await loadKit();
const d = L.loadLevel('hem');
const c = paintLevel(d);
c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = '03-hem.png'; a.click(); });
```

The level lab's Export PNG also works, with the overlay on for the guide copy (routes, pads, and in the river and night worlds the river crossing and the light sources). Set its zone to the level's world.

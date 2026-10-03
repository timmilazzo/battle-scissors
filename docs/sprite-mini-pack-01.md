# Sprite mini-pack 01 handoff

This pack contains the previously uncommitted assets from the “Schedule Sprite Updates” conversation, supplied as `battle-scissors-sprite-mini-pack-01.zip`.

## Files delivered

- `assets/kit/incoming/29_autumn/`: eight autumn hero sprites.
- `assets/kit/incoming/30_night/`: eight night hero sprites and five resized fill sprites.
- `assets/kit/incoming/31_snow/`: eight snow hero sprites.
- `assets/kit/incoming/manifest.json`: repository-relative paths, dimensions, and SHA-256 checksums for all 29 PNGs.
- `assets/kit/incoming/DELIVERY.md`: original preparation notes, including outstanding work. Its “NOT committed” status describes the original handoff, before this repository delivery.

The incoming directory is normally ignored. These 31 specific files are explicitly tracked to make the source art and manifest available to other agents; the existing ignore rule remains in place for future staging files.

## Validation performed

All 29 PNGs were fully decoded with Pillow. Each SHA-256 checksum and canvas dimension matched the manifest. Every image was RGBA with transparent pixels and visible content. The archive paths were checked before extraction, no existing files were overwritten, and a contact sheet was visually reviewed.

## Next integration step

The PNGs are staged source art; runtime WebP assets and gameplay code have not been changed. The existing `tools/kit-import.html` has keys for these asset names.

1. Start `node tools/serve.js 8087 --write` from the repository root in a trusted development environment.
2. Open `/tools/kit-import.html` on that server and run the importer. It reads the incoming manifest, converts the sprites to WebP, and prints measured `src/kit.js` entries.
3. Review the generated replacements under `assets/kit/29_autumn/`, `30_night/`, and `31_snow/`, and apply the corresponding entries to `src/kit.js`.
4. Check the affected worlds in the game before committing the runtime integration.

The importer was inspected but not run as part of this source-art handoff. River/snow strip replacements (section 28) and Round 6 exports are absent from this archive and remain outstanding. The two snow cottages are overhead roof variants; review them against the wishlist during integration.

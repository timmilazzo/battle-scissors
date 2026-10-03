# Sprite mini-pack 01 — 3 October 2026

29 validated sprites for the outstanding Round 5 corrections in `docs/sprite-wishlist.md`.

- Section 29: eight autumn heroes at requested dimensions.
- Section 30: eight night heroes at requested dimensions and five existing fill sprites resized to 40–72 px canvases.
- Section 31: eight snow heroes at requested dimensions. Cottages use an overhead roof view with warm skylights.

All files are sRGB RGBA PNGs with transparent backgrounds. Images were visually reviewed and fully decoded after export. Exact sizes and SHA-256 checksums are in `manifest.json`.

## Import

The archive paths are relative to the repository root. Extract into the repository, retaining the `assets/kit/incoming/` tree. The manifest follows the existing `tools/kit-import.html` schema; its `file` values are repository-relative. Run the existing dev server with `--write`, open the import tool, and use its generated kit entries. Runtime assets and gameplay code have not been modified.

## Delivery status

Prepared and validated locally; NOT committed. The GitHub integration returned HTTP 403 `Resource not accessible by integration` on the blob upload. Do not mark these requests remotely delivered until a commit has been verified.

Wishlist observed: blob `55023db276f6ed6683186d2498499aed55af374b`; main commit `7f4d0b1486ca53481d0a6f48fcf7d2fd3a4fb1c4`.

## Pending

- Section 28: brown/blue river and two snow-rim strip replacements. Generated candidates failed seam checks and are deliberately excluded.
- Round 6 sections 34–46: follow the current wishlist's order of work. Button sheets have been generated but are not yet exported or approved; do not count them as complete.
- Do not regenerate this pack once it has been imported or committed. Check the repository assets and manifest first.

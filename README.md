# anime-study-player

Reusable React study player for anime learning clips.

## Why this repo exists

This package extracts the short-video player module out of the main app so it can be maintained independently.

The player is built on top of `ArtPlayer` because it already provides:

- a full control bar
- draggable progress
- volume adjustment
- fullscreen and picture-in-picture
- playback rate and settings
- flexible customization for study overlays

For future streaming scenarios, the player can be extended with transport-layer libraries such as `flv.js`, `hls.js`, or other demuxers. For the current local anime-study workflow, `ArtPlayer` is the better fit because it solves the playback UI itself.

## What it exports

- `AnimeStudyPlayer`
- player handle types
- study segment / knowledge point / state snapshot types

## Development

```bash
npm install
npm run typecheck
npm run build
```

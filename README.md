# Maro’s world

A little world, mostly mine: four familiar places between Milan and Tbilisi, as a small 3D atlas. The Bocconi library, my workspace at home, QSI and Stamba.

**Visit: https://tallmaro.github.io/maro-world/**

Plain HTML, CSS and ES modules on Three.js r180. No build step, no backend, no analytics, and nothing from a third party loads until you ask for it.

## Explore

- Choose a miniature, its label or a place in the bottom index. **Back to world** or Escape returns to the atlas, and browser back/forward works too.
- Drag to orbit, scroll or pinch to zoom, or use the rotate/zoom/reset buttons. On the focused scene, arrow keys rotate, + / − zoom and Home resets. Everything is reachable with Tab and Enter.
- Library: outside, study room, at the door. Study mode shows the desks and shelves, actual Bocconi course titles and a table close-up; the entrance doors open and close.
- Home: the whole room cutaway, the desk, the shelves, daylight or lamplight.
- QSI: campus, veranda, field. Stamba: courtyard, books and greenery, street side.
- Reduced-motion settings make camera moves instant. The scene stops rendering when idle.

These are stylised, reference-based miniatures, not measured reconstructions, and the atlas is not a map to scale.

## Music

Each place has one song. Nothing loads until you press **Load official player**; then the provider’s own embed appears (one at a time) and is removed when you close it or leave the place. Embeds can be blank, preview-only or need sign-in, so an official link is always there too. No audio, lyrics or artwork is bundled.

| Place | Recording | Provider |
| --- | --- | --- |
| Bocconi library | Jürgen Paape — So weit wie noch nie, Original Mix | Spotify |
| Home | Serge Gainsbourg — La Javanaise, Mono Version | Apple Music |
| QSI | Pop Smoke — Dior, Meet The Woo (explicit lyrics) | Spotify |
| Stamba | Radiohead — Weird Fishes / Arpeggi, In Rainbows | Spotify |

## Run it locally

Needs Node 22+.

```sh
npm start   # http://127.0.0.1:4390, or PORT=4391 npm start
```

The server listens on 127.0.0.1 and serves only `public/`. Any static server pointed at `public/` works too: all URLs are relative, so the site also runs from a subpath. Opening `index.html` via `file://` does not work (ES modules need http).

## Code

- `public/src/world.js`: the one renderer, camera, lighting, navigation and teardown.
- `public/src/assets.js`: normalizes each model and batches the room from 568 meshes to 69 with the same triangles.
- `public/src/places.js`: place text, course titles and music metadata.
- `public/src/music.js`: the opt-in player.
- `public/assets/*/landmark.js`: the four model factories. See `public/assets/PROVENANCE.txt`; `asset-sources.json` records their hashes.

## Tests

```sh
npm ci --ignore-scripts
npm test               # geometry, batching, music lifecycle, server boundary, relative URLs
npm run test:browser   # Chromium checks; set PLAYWRIGHT_MODULE and CHROME_PATH
```

Browser checks cover desktop and mobile-sized Chromium, not physical phones.

## Deploy

Every push to `main` runs `npm test` and publishes `public/` to GitHub Pages (`.github/workflows/pages.yml`). Pages cannot send the local server’s security headers, so `index.html` carries the same Content-Security-Policy as a meta tag.

## Credits

Three.js, OrbitControls and BufferGeometryUtils: MIT (`public/vendor/THREE-LICENSE.txt`). Barlow and Barlow Condensed: SIL Open Font License (`public/fonts/OFL-Barlow.txt`).

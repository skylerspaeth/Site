# Project: grand-unified-website

Next-generation combined travel blog and photography & coding portfolio.

This is a from-scratch rebuild. It is not based on any content or code from the old site, with one exception: the GitHub contributions graph component (see Home).

## Stack
- Astro + Tailwind CSS. Content is Markdown/MDX.
- No UI framework (no React). Use plain `.astro` components, and only add a framework island if a library really needs one.
- Hosting target is Cloudflare (free tier), via the `@astrojs/cloudflare` adapter. Server code runs on Workers, not Node: stick to web-standard APIs such as `fetch`, and avoid Node-only modules (`fs` and native packages) in server code. Keep media base URLs in one config value so it stays easy to move hosts or storage.
- Secrets are environment variables declared in `astro.config.mjs` (`GITHUB_TOKEN`), set in a local, gitignored `.env`, and in Cloudflare's dashboard for production.
- Prefer off-the-shelf libraries and other people's code over writing our own. Hand-written code committed to git should be minimal. Almost everything should be Markdown or very basic code, with generated code being fine.
- Planned libraries: PhotoSwipe (fullscreen viewer), a justified/masonry layout (photo mosaic), MapLibre GL (globe), `astro:assets` (responsive, lazy-loaded images), a click-to-load YouTube embed component.

## Design language
- Modern and minimal. Rounded corners always, never square, unless there is a user-approved reason
- Pure black (`#000000`) background to look great on OLED. Everything else (surfaces, text) is greys.
- Color is reserved for UI components and the "graphical" content: photos, the map and similar. The reader's attention should be drawn to the pretty parts.
- Dark/light mode responsive (follows the system, with a manual toggle). Responsive across screen sizes and device types.
- Design tokens live in `src/styles/global.css`.
- Pages have no big H1 title: the tab bar names the page, and the space goes to the content (e.g. the travel map is sized to show its whole box on load, below the tab bar, with no scrolling).
- Navigation is tab-based: a floating pill tab bar with a sliding active indicator. Pages are normal full page loads (no client-side router): the active tab is remembered in `sessionStorage` so the pill starts on the previous tab and slides to the new one. Don't reintroduce a view-transitions router, because its page snapshots ghost the pill and break the bar's backdrop blur.

## Sections (one tab each)

### Home
- Supports a custom component. The GitHub contributions graph from the old site is the one thing being kept. It's `src/components/ContributionsGraph.astro`, a server island (`server:defer`) that fetches live GitHub data, with a one-hour CDN cache. Usernames are in `src/data/config.js`.

### Travel blog
- Posts are written in Markdown (or a similar markup).
- Supports high-resolution inline photos and videos that lazy load.
- Supports embedding YouTube videos.
- The Travel page is a list of posts on the left (newest first) beside the map (stacked on small screens, map first). Each post entry has one square thumbnail on its left (`photo` in frontmatter, via `astro:assets`; a gradient placeholder until set). The map's attribution is a compact, (i) button in the map's bottom-right corner, built to match the zoom buttons exactly (a custom control in `TravelMap.astro`).
- Travel map (`src/components/TravelMap.astro`), styled after joshuaraichur.com's globe: visited countries highlighted (translucent fill plus outline) and glowing dots for places.
  - It's a 2D Mercator map (a deliberate choice over a globe): pan and zoom like Google Maps, but confined to a single world box (`bounds` in `src/data/config.js`) so nothing repeats sideways. The box's seam is deliberately the Bering Strait (169W), not the antimeridian: mainland Alaska is on the left; Russia (Chukotka, Wrangel), Fiji, Samoa and Tonga are whole on the right, where longitudes run past 180 (MapLibre draws the next world copy there). Antarctica is cropped again (it has no countries, and showing it shrinks the map). It starts fully zoomed out on the whole box. The wheel zooms the map directly (no ctrl/cmd): the page itself barely scrolls, and you scroll it by hovering something that isn't the map.
  - MapLibre GL with VersaTiles' dark vector style (`eclipse`; free, no key; URL in `src/data/config.js`), rethemed in `TravelMap.astro` by layer kind (land flat and dark, water pure black, quiet grey streets and borders, mixed-case grey labels, unwanted layers hidden), with the colors as `--map-*` tokens in `global.css`. The map is always dark, even in light mode (`.theme-dark`). We started on OpenFreeMap's style and switched (the user's call) because VersaTiles' coastlines are far sharper at world zoom and its tiles are lighter (about 130 KB for the world at zoom 1). Consequences: there are no labels at the resting zoom (its tiles carry none below zoom 2), country labels appear from zoom 2, capitals from 4, and VersaTiles' own lakes only from zoom 4, so below that the lakes (Great Lakes, Caspian) come from OpenFreeMap's tiles, capped at zoom 1 (`lakes` layer). The style's globe projection and sky are overridden to mercator.
  - Terrain shading is Natural Earth's pre-built shaded-relief tiles (served by OpenFreeMap, public domain), darkened and desaturated in `TravelMap.astro`. A custom generated relief image looked low-res and was dropped (no custom assets). The reference map's own style is a private Mapbox style we can't read, so tones are matched by measurement (its land is very dark: about 10-30 out of 255, ocean pure black).
  - Dropped after trying (they didn't help or looked worse): a second OpenFreeMap tile source with halved tile size, deeper OpenFreeMap tile levels (6-9 MB), a Natural Earth ocean-polygon overlay.
  - The map canvas is hidden until MapLibre's `load` event (15 s fallback), then fades in, so half-loaded stages never flash.
  - Visited countries come from a Google Sheet (the source of truth, not post frontmatter): published as CSV, URL in `VITE_SHEET_CSV_URL` (`.env` locally; repo secret + host build env in prod), parsed at build time by `src/lib/visited-sheet.ts` (no header row; columns Country as ISO alpha-2, Arrival, Departure, TotalDays, TripNumber, Order; the home country leaves dates blank). The `VITE_` prefix is deliberate: the prerender runs in workerd, where `astro:env` secrets aren't loaded without a wrangler config. The sheet is only read at build time, so `.github/workflows/rebuild.yml` rebuilds and deploys every 3 hours. Place dots still come from post frontmatter (`places` as name + `[lng, lat]`; see `src/content.config.ts`). Both are built by the build-time endpoints `src/pages/travel/visited.geojson.ts` (Natural Earth 1:10m polygons from `src/data/countries-10m.topo.json`, a generated 4.5 MB TopoJSON that stays out of the deployed Worker because the endpoint is prerendered; regenerate with `node scripts/minify-outlines.mjs`. 1:10m is a map scale (1:10,000,000), not 10 m of precision: it is generalized to kilometres. It replaced 50m via `world-atlas` for sharper outlines when zoomed in. geoBoundaries (OpenStreetMap-based, about 100 points where 1:10m has 12 on the south Kaliningrad border) was tried and dropped by the user's call: 8.6 MB in the repo, about 2.6 MB brotli served with all countries, and it looked worse in places. The rings cross the antimeridian uncut, so the endpoint unwraps them to longitudes past 180)) and `places.geojson.ts`.
  - MapLibre is pinned to 5.x on purpose: 6.x needs a manual worker URL, and under Vite dev the rewritten worker file takes 10-45 s to start. Also don't put a `bounds` edge at exactly +-180: MapLibre's constrain math divides by zero there (hence 179.999).
  - Not built yet: clicking a country to show the blog posts from there.

### Photo portfolio
- Divided into series.
- Mosaic layout so that mixed aspect ratios waste no space.
- Clicking a photo opens fullscreen. Arrow keys move between photos and Escape exits.
- Optional caption per photo, shown in fullscreen and in image's hover tooltip

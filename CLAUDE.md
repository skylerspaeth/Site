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
  - MapLibre GL with OpenFreeMap's dark vector style (free, no key; URL in `src/data/config.js`). The look is that style plus paint overrides applied on load, with the colors as `--map-*` tokens in `global.css`. The map is always dark, even in light mode (`.theme-dark`).
  - Terrain shading is the style's own pre-built shaded-relief tiles (`ne2_shaded`), darkened and desaturated in `TravelMap.astro`. We tried a custom generated relief image matched to the reference map's tones; it looked low-res, so it was dropped (no custom assets). The reference map's own style is a private Mapbox style we can't read, so tones are matched by measurement (its land is very dark: about 10-30 out of 255, ocean pure black).
  - Low-zoom coastline detail: the zoomed-out coastlines (Norway etc.) look blobby because the style's low-zoom water shapes are generalized. Tried and dropped: a second tile source with halved tile size for water and borders (it changed nothing about the coasts; it only made state borders show at world zoom), deeper tile levels (6-9 MB for a world view), a Natural Earth ocean-polygon overlay, and a custom relief image. Fixing it needs a different, lighter source of low-zoom coastlines.
  - Visited countries and place dots are generated from post frontmatter (`countries` as ISO 3166-1 alpha-2, `places` as name + `[lng, lat]`; see `src/content.config.ts`) by the build-time endpoints `src/pages/travel/visited.geojson.ts` (Natural Earth 50m polygons via `world-atlas`, whose rings cross the antimeridian uncut, so the endpoint unwraps them to longitudes past 180) and `places.geojson.ts`.
  - MapLibre is pinned to 5.x on purpose: 6.x needs a manual worker URL, and under Vite dev the rewritten worker file takes 10-45 s to start. Also don't put a `bounds` edge at exactly +-180: MapLibre's constrain math divides by zero there (hence 179.999).
  - Not built yet: clicking a country to show the blog posts from there.

### Photo portfolio
- Divided into series.
- Mosaic layout so that mixed aspect ratios waste no space.
- Clicking a photo opens fullscreen. Arrow keys move between photos and Escape exits.
- Optional caption per photo, shown in fullscreen and in image's hover tooltip

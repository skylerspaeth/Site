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
- Navigation is tab-based: a floating pill tab bar with a sliding active indicator. Pages are normal full page loads (no client-side router): the active tab is remembered in `sessionStorage` so the pill starts on the previous tab and slides to the new one. Don't reintroduce a view-transitions router, because its page snapshots ghost the pill and break the bar's backdrop blur.

## Sections (one tab each)

### Home
- Supports a custom component. The GitHub contributions graph from the old site is the one thing being kept. It's `src/components/ContributionsGraph.astro`, a server island (`server:defer`) that fetches live GitHub data, with a one-hour CDN cache. Usernames are in `src/data/config.js`.

### Travel blog
- Posts are written in Markdown (or a similar markup).
- Supports high-resolution inline photos and videos that lazy load.
- Supports embedding YouTube videos.
- Later: a globe map like joshuaraichur.com's, with visited countries highlighted in neon. Clicking a country shows the blog posts from there.
  - That site uses Mapbox GL JS in globe mode, with a GeoJSON of visited countries (fill plus outline) and glowing dots for cities. It's custom code, not a library or theme.
  - We plan to use MapLibre GL and generate the visited-countries list from post frontmatter.

### Photo portfolio
- Divided into series.
- Mosaic layout so that mixed aspect ratios waste no space.
- Clicking a photo opens fullscreen. Arrow keys move between photos and Escape exits.
- Optional caption per photo, shown in fullscreen and in image's hover tooltip

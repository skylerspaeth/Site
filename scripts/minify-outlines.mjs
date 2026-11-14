// Regenerates src/data/countries-10m.topo.json (rarely needed: Natural Earth changes slowly).
// Usage: node scripts/minify-outlines.mjs
// Downloads Natural Earth's 1:10m admin-0 countries (public domain, ~25 MB), keys each country by its numeric ISO code
// (Natural Earth leaves it -99 for France and Norway, so those fall back to world-countries by 3-letter code),
// drops attributes and territories without a code, and writes quantized TopoJSON via topojson-server.
import { writeFileSync } from 'node:fs';
import countries from 'world-countries';
import { topology } from 'topojson-server';

const url = 'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/10m/cultural/ne_10m_admin_0_countries.json';
const source = await (await fetch(url)).json();
const features = source.features.flatMap(({ properties: p, geometry }) => {
  const n3 = String(p.ISO_N3) !== '-99' ? String(p.ISO_N3).padStart(3, '0')
    : countries.find((c) => c.cca3 === p.ADM0_A3 || c.cca3 === p.ISO_A3 || c.cca2 === p.ISO_A2)?.ccn3;
  return n3 ? [{ type: 'Feature', id: n3, properties: {}, geometry }] : [];
});
const topo = topology({ countries: { type: 'FeatureCollection', features } }, 1e6);
writeFileSync(new URL('../src/data/countries-10m.topo.json', import.meta.url), JSON.stringify(topo));

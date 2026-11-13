import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { feature } from 'topojson-client';
import atlas from 'world-atlas/countries-50m.json';
import countries from 'world-countries';

// Built at build time: every country named in a post's `countries` frontmatter, as Natural Earth polygons.
export const GET: APIRoute = async () => {
  const codes = new Set((await getCollection('posts')).flatMap((post) => post.data.countries));
  const known = countries.filter((c) => codes.has(c.cca2));
  for (const code of codes) {
    if (!known.some((c) => c.cca2 === code)) throw new Error(`Unknown country code in post frontmatter: ${code}`);
  }
  const ids = new Set(known.map((c) => c.ccn3));
  const topology = atlas as unknown as Parameters<typeof feature>[0];
  const world = feature(topology, topology.objects.countries) as GeoJSON.FeatureCollection;
  const visited = { ...world, features: world.features.filter((f) => ids.has(String(f.id))) };
  // world-atlas doesn't cut countries at the antimeridian: Russia's and Fiji's rings jump from +180 to -180.
  // On a flat map that smears them across the world, so make each ring continuous (longitudes past 180),
  // which is how MapLibre expects an uncut polygon to arrive.
  const unwrap = (ring: number[][]) => {
    let offset = 0;
    return ring.map(([x, y], i) => {
      const jump = i ? x - ring[i - 1][0] : 0;
      offset += jump > 180 ? -360 : jump < -180 ? 360 : 0;
      return [x + offset, y];
    });
  };
  for (const { geometry } of visited.features) {
    if (geometry.type === 'Polygon') geometry.coordinates = geometry.coordinates.map(unwrap);
    if (geometry.type === 'MultiPolygon') geometry.coordinates = geometry.coordinates.map((poly) => poly.map(unwrap));
  }
  // Round coordinates to ~100 m: plenty for 1:50m borders, and it cuts the file to a third.
  const body = JSON.stringify(visited, (_, v) => (typeof v === 'number' ? Math.round(v * 1e3) / 1e3 : v));
  return new Response(body, { headers: { 'content-type': 'application/geo+json' } });
};

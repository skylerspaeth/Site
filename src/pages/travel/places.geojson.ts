import type { APIRoute } from 'astro';
import Papa from 'papaparse';

// Built at build time from the places Google Sheet (published as CSV, URL in VITE_PLACES_CSV_URL).
// Has a header row. Columns: Locality, State/Province/Region, Country, Lat, Lon.
// Like the visited-countries sheet, bad data fails the build loudly (e.g. a Lat/Lon cell that was still "Loading..." when
// Google published it) rather than shipping a map with dots silently missing.
export const GET: APIRoute = async () => {
  const url = import.meta.env.VITE_PLACES_CSV_URL as string | undefined;
  if (!url) throw new Error("VITE_PLACES_CSV_URL is not set: add the published places-sheet CSV URL to .env (and to the host's build environment).");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetching the places sheet failed: HTTP ${res.status}`);
  const { data } = Papa.parse<string[]>(await res.text(), { skipEmptyLines: 'greedy' });
  const bad: string[] = [];
  const features = data.slice(1).flatMap((cells, i) => {
    const [locality = '', region = '', country = '', lat = '', lon = ''] = cells.map((c) => c.trim());
    const coords = [Number(lon), Number(lat)];
    if (!lat || !lon || coords.some((n) => !Number.isFinite(n))) {
      bad.push(`row ${i + 2} (${locality || 'unnamed'}): Lat "${lat}", Lon "${lon}"`);
      return [];
    }
    return [{
      type: 'Feature',
      geometry: { type: 'Point', coordinates: coords },
      properties: { title: [locality, region].filter(Boolean).join(', '), subtitle: country }
    }];
  });
  if (bad.length) throw new Error(`Places sheet has ${bad.length} row(s) with non-numeric Lat/Lon:\n  ${bad.join('\n  ')}`);
  return Response.json({ type: 'FeatureCollection', features });
};

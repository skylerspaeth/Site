import Papa from 'papaparse';
import countries from 'world-countries';

export interface Visit {
  /** ISO 3166-1 alpha-2 */
  code: string;
  /** ISO dates (YYYY-MM-DD); undefined for the home country, which has none. */
  arrival?: string;
  departure?: string;
  totalDays?: number;
  tripNumber: number;
  order: number;
}

// Build-time: the Google Sheet is the source of truth for visited countries. Publish the tab as CSV
// (File > Share > Publish to web > Link > the tab > CSV) and put that URL in VITE_SHEET_CSV_URL
// (Vite only exposes VITE_-prefixed vars at build time; the prerender runs in workerd, where astro:env secrets
// aren't loaded without a wrangler config). Only this server-side file reads it.
//
// No header row. Columns, in order: Country (ISO alpha-2), Arrival, Departure, TotalDays, TripNumber, Order.
// Dates look like "9-Jan-2015". The home country row may leave arrival/departure/days blank.
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function toIsoDate(cell: string, row: number): string | undefined {
  if (!cell) return undefined;
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(cell);
  const month = m ? MONTHS.indexOf(m[2].toLowerCase()) : -1;
  if (!m || month < 0) throw new Error(`Sheet row ${row}: unrecognized date "${cell}" (expected e.g. 9-Jan-2015).`);
  return new Date(Date.UTC(+m[3], month, +m[1])).toISOString().slice(0, 10);
}

export async function loadVisits(): Promise<Visit[]> {
  const url = import.meta.env.VITE_SHEET_CSV_URL as string | undefined;
  if (!url) throw new Error("VITE_SHEET_CSV_URL is not set: add the published Google Sheet CSV URL to .env (and to the host's build environment).");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetching the visited-countries sheet failed: HTTP ${res.status}`);
  const { data } = Papa.parse<string[]>(await res.text(), { skipEmptyLines: true });
  const known = new Set(countries.map((c) => c.cca2));
  return data.map((cells, i) => {
    const [country = '', arrival = '', departure = '', days = '', trip = '', order = ''] = cells.map((c) => c.trim());
    const code = country.toUpperCase();
    if (!known.has(code)) throw new Error(`Sheet row ${i + 1}: "${country}" is not an ISO 3166-1 alpha-2 country code. Is the URL a published CSV (not HTML)?`);
    return {
      code,
      arrival: toIsoDate(arrival, i + 1),
      departure: toIsoDate(departure, i + 1),
      totalDays: days ? Number(days) : undefined,
      tripNumber: Number(trip),
      order: Number(order)
    };
  });
}

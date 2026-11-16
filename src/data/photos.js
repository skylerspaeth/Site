// Photo series. Placeholder gradients stand in until real photos exist: give a series a `cover` and
// `photos: [{ src, caption }]` (images imported via astro:assets) and the pages use them instead.
export const series = [
  { slug: 'nocturnes', title: 'Nocturnes', ratios: ['3/4', '1/1', '4/3', '2/3', '16/9', '4/5', '3/2', '1/1', '2/3'] },
  { slug: 'snow', title: 'Snow', ratios: ['4/3', '2/3', '1/1', '3/2', '4/5', '16/9', '3/4'] },
  { slug: 'monochrome', title: 'Monochrome', ratios: ['1/1', '3/4', '3/2', '2/3', '4/3', '4/5'] }
];

// Placeholder gradient for the nth tile of a series.
export const placeholder = (seriesIndex, i) =>
  `background: linear-gradient(${i * 40}deg, hsl(${(seriesIndex * 90 + i * 47) % 360} 65% 50%), hsl(${(seriesIndex * 90 + i * 47 + 50) % 360} 55% 18%))`;

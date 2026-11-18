// Photo handling for post Markdown, done at build time so the HTML is right from the first byte:
// 1. A photo alone in its paragraph with alt text (![caption](src)) becomes a figure with the alt text as a
//    visible caption underneath. Photos without alt text, and photos in a row, get no visible caption. The photo
//    must be separated from surrounding text by blank lines, or it isn't alone in its paragraph. (The Markdown
//    title, ![alt](src "text"), is separate: the fullscreen viewer's caption and the hover tooltip.)
// 2. Alt text ending in `|fit` (an Obsidian-style option, e.g. ![Caption|fit](./x.jpg)) gets a `fit` class and the
//    suffix is removed from the alt. The post styles then size that photo to the usable screen height (for tall
//    portraits); other photos use the default, shorter cap.
// 3. Each photo gets its pixel size as CSS variables, and a `sizes` hint for the responsive srcset Astro generates.

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { imageMetadata } from 'astro/assets/utils';

const isBlank =(n) => n.type === 'text' && !n.value.trim();
const FIT = /\s*\|\s*fit\s*$/;
// Tells the browser how wide a photo displays (the post column is 42rem = 672px, plus the page's side padding), so it
// downloads the smallest srcset size that's sharp enough instead of assuming full viewport width.
const SIZES = '(min-width: 720px) 672px, 100vw';

function captionFigure(p) {
  p.children.forEach((n) => { if (n.tagName === 'img') tagFit(n); }); // so a `|fit` marker never ends up in the caption
  const kids = p.children.filter((n) => !isBlank(n));
  const img = kids[0];
  if (kids.length !== 1 || img.tagName !== 'img' || !img.properties?.alt) return p;
  const caption = img.properties.alt;
  return { ...p, tagName: 'figure', children: [img, { type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: caption }] }] };
}

function tagFit(img) {
  const alt = img.properties?.alt;
  if (typeof alt !== 'string' || !FIT.test(alt)) return;
  img.properties.alt = alt.replace(FIT, '');
  img.properties.className = [...(img.properties.className ?? []), 'fit'];
}

// A lazy photo has no size until it loads, so the page would jump as photos arrive. Writing the pixel size into CSS
// variables (--w, --h) lets the styles size the photo, and so reserve its space, from the start.
async function addPixelSize(img, file) {
  const src = img.properties?.src;
  if (typeof src !== 'string' || /^([a-z][a-z0-9+.-]*:|\/)/i.test(src) || !file.path) return; // local, relative photos only
  try {
    const { width, height } = await imageMetadata(await readFile(resolve(dirname(file.path), decodeURI(src))));
    img.properties.style = `--w:${width};--h:${height}`;
  } catch {} // no size: the styles fall back to waiting for the photo to load
}

export default function rehypePostPhotos() {
  return async (tree, file) => {
    const photos = [];
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => (child.tagName === 'p' ? captionFigure(child) : child));
      node.children.forEach((child) => { if (child.tagName === 'img') { tagFit(child); child.properties.sizes = SIZES; photos.push(child); } });
      node.children.forEach(walk);
    };
    walk(tree);
    await Promise.all(photos.map((img) => addPixelSize(img, file)));
  };
}

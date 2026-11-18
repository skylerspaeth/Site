// Photo handling for post Markdown, done at build time so the HTML is right from the first byte:
// 1. A photo alone in its paragraph with alt text (![caption](src)) becomes a figure with the alt text as a
//    visible caption underneath. Photos without alt text, and photos in a row, get no visible caption. The photo
//    must be separated from surrounding text by blank lines, or it isn't alone in its paragraph. (The Markdown
//    title, ![alt](src "text"), is separate: the fullscreen viewer's caption and the hover tooltip.)
// 2. Alt text ending in `|fit` (an Obsidian-style option, e.g. ![Caption|fit](./x.jpg)) gets a `fit` class and the
//    suffix is removed from the alt. The post styles then size that photo to the usable screen height (for tall
//    portraits); other photos use the default, shorter cap.

const isBlank = (n) => n.type === 'text' && !n.value.trim();
const FIT = /\s*\|\s*fit\s*$/;

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

export default function rehypePostPhotos() {
  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => (child.tagName === 'p' ? captionFigure(child) : child));
      node.children.forEach((child) => { if (child.tagName === 'img') tagFit(child); });
      node.children.forEach(walk);
    };
    walk(tree);
  };
}

// Photo handling for post Markdown, done at build time so the HTML is right from the first byte:
// 1. A photo alone in its paragraph with a Markdown title (![alt](src "caption")) becomes a figure with the
//    title as a visible caption underneath. Photos without a title, and photos in a row, are left alone.
//    The photo must be separated from surrounding text by blank lines, or it isn't alone in its paragraph.
// 2. Alt text ending in `|fit` (an Obsidian-style option, e.g. ![Caption|fit](./x.jpg)) gets a `fit` class and the
//    suffix is removed from the alt. The post styles then size that photo to the usable screen height (for tall
//    portraits); other photos use the default, shorter cap.

const isBlank = (n) => n.type === 'text' && !n.value.trim();
const FIT = /\s*\|\s*fit\s*$/;

function captionFigure(p) {
  const kids = p.children.filter((n) => !isBlank(n));
  const img = kids[0];
  if (kids.length !== 1 || img.tagName !== 'img' || !img.properties?.title) return p;
  const caption = img.properties.title;
  delete img.properties.title;
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

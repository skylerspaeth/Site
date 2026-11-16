// Replaces a paragraph containing only `[[toc]]` with a table of contents built from the post's headings.
import { toc } from 'mdast-util-toc';

export default function remarkTocMarker() {
  return (tree) => {
    const i = tree.children.findIndex(
      (n) => n.type === 'paragraph' && n.children.length === 1 && n.children[0].type === 'text' && n.children[0].value.trim().toLowerCase() === '[[toc]]'
    );
    if (i < 0) return;
    const { map } = toc(
      { type: 'root', children: tree.children.filter((_, j) => j !== i) },
      { maxDepth: 3, tight: true }
    );
    if (!map) return tree.children.splice(i, 1);
    tree.children[i] = {
      type: 'blockquote',
      data: { hName: 'nav', hProperties: { className: ['toc'], ariaLabel: 'Table of contents' } },
      children: [map],
    };
  };
}

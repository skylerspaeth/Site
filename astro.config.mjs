// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import { unified } from '@astrojs/markdown-remark';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkTocMarker from './src/lib/remark-toc-marker.mjs';

export default defineConfig({
  adapter: cloudflare(),
  markdown: {
    processor: unified({
    remarkPlugins: [remarkTocMarker],
    rehypePlugins: [
      rehypeSlug,
      // A copy-link button after each heading; the click handler lives in [id].astro.
      [rehypeAutolinkHeadings, {
        behavior: 'append',
        properties: { class: 'anchor', 'aria-label': 'Copy link to this section' },
        content: [], // no inner text: the icon is drawn in CSS
      }],
    ],
    }),
  },
  vite: { plugins: [tailwindcss()] },
  env: {
    schema: {
      GITHUB_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true })
    }
  }
});

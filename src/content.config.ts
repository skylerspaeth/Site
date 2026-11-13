import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Travel posts. `countries` (ISO 3166-1 alpha-2) lights up the map; `places` become its glowing dots.
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    photo: image().optional(), // the post's one thumbnail photo (path relative to the post); shown square
    date: z.coerce.date(),
    countries: z.array(z.string().length(2)),
    places: z.array(z.object({ name: z.string(), coords: z.tuple([z.number(), z.number()]) })).default([])
  })
});

export const collections = { posts };

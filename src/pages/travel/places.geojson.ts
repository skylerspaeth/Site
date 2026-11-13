import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Built at build time: every place named in a post's `places` frontmatter, as GeoJSON points.
export const GET: APIRoute = async () => {
  const posts = await getCollection('posts');
  const features = posts.flatMap((post) =>
    post.data.places.map(({ name, coords }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: coords },
      properties: { name, post: post.id, title: post.data.title }
    }))
  );
  return Response.json({ type: 'FeatureCollection', features });
};

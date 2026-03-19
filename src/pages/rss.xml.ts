import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sorted = posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  return rss({
    title: 'The Log — Ishan Bagchi',
    description: 'Technical writings on software, systems, and craft.',
    site: context.site!,
    items: sorted.map((post) => {
      const slug = post.id
        .replace(/\.(md|mdx)$/, '')
        .replace(/\/index$/, '');
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `/log/${slug}`,
      };
    }),
  });
}

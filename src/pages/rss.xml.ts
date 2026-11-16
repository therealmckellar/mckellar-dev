import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog');
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );

  return rss({
    title: "Richard McKellar's Blog | AI Adoption & Commercial Funding",
    description:
      'Field notes by Richard McKellar on 90-day AI adoption, Fractional CAIO vs FDE builds, CRM integrations, and commercial lending.',
    site: context.site || 'https://mckellar.dev',
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: new Date(post.data.date),
      description: post.data.description,
      link: `/blog/${post.id}`,
      author: `richard@mckellar.dev (${post.data.author})`,
      categories: [post.data.category, ...(post.data.tags || [])],
    })),
    customData: '<language>en-us</language>',
  });
}

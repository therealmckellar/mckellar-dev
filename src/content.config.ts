import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    category: z.enum(['ai', 'funding', 'strategy']),
    readTime: z.string(),
    author: z.string().default('Richard McKellar'),
  }),
});

export const collections = {
  blog: blogCollection,
};

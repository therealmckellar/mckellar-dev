import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().optional(),
    description: z.string(),
    date: z.string(),
    dateModified: z.string().optional(),
    category: z.enum(['ai', 'funding', 'strategy']),
    readTime: z.string(),
    author: z.string().default('Richard McKellar'),
    tags: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};

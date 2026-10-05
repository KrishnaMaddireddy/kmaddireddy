import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const articles = defineCollection({
  loader: glob({ base: './src/content/articles', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // Where the piece first appeared (LinkedIn, Medium...). Shown as a link under the article.
    originalUrl: z.string().url().optional(),
    // Optional cover image shown at the top of the article and in link previews.
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
  }),
});

export const collections = { articles };

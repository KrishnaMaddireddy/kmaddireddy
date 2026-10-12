import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// The browser editor saves untouched optional fields as empty strings; treat those as "not set".
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), schema.optional());

// Accept tags however they're typed ("#GovCon #AI", "llm, data-quality", ["Search Engineering"])
// and turn each into a URL-safe tag: govcon-style hashtags become "gov-con", spaces become hyphens.
const toTags = (v: unknown): string[] => {
  const raw = Array.isArray(v) ? v : typeof v === 'string' ? [v] : [];
  const out = raw
    .flatMap((t) => String(t).split(/[,#]|\s+(?=#)/))
    .map((t) =>
      t
        .trim()
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    )
    .filter(Boolean);
  return [...new Set(out)];
};

const articles = defineCollection({
  loader: glob({ base: './src/content/articles', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: optional(z.coerce.date()),
    tags: z.preprocess(toTags, z.array(z.string())),
    draft: z.boolean().default(false),
    // Where the piece first appeared (LinkedIn, Medium...). Shown as a link under the article.
    originalUrl: optional(z.string().url()),
    // Optional cover image shown at the top of the article and in link previews.
    cover: optional(z.string()),
    coverAlt: optional(z.string()),
  }),
});

export const collections = { articles };

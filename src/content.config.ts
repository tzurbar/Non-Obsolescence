import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Every collection carries the same translation-tracking fields:
// - translationStatus 'original' (source content) | 'machine' (auto-translated draft) | 'reviewed' (human-checked)
// - translationOf: the source entry's id (e.g. "en/replace-a-lightbulb"), unset for original content
// - sourceUpdated: the source's publishDate/updated value at translation time, used to detect stale translations
const translationFields = {
  translationStatus: z.enum(['original', 'machine', 'reviewed']).default('original'),
  translationOf: z.string().optional(),
  sourceUpdated: z.coerce.date().optional()
};

const link = z.object({
  label: z.string(),
  url: z.string().url()
});

const step = z.object({
  text: z.string(),
  image: z.string().optional(),
  partLinks: z.array(link).default([]),
  videoLinks: z.array(link).default([])
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    productName: z.string(),
    category: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    estimatedTime: z.string(),
    tools: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    steps: z.array(step).default([]),
    partLinks: z.array(link).default([]),
    videoLinks: z.array(link).default([]),
    featured: z.boolean().default(false),
    authorName: z.string().optional(),
    publishDate: z.date(),
    ...translationFields
  })
});

const fixability = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/fixability' }),
  schema: z.object({
    brand: z.string(),
    productCategory: z.string(),
    score: z.number().min(0).max(10),
    summary: z.string(),
    sources: z.array(z.string()).default([]),
    updated: z.date(),
    ...translationFields
  })
});

const materials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/materials' }),
  schema: z.object({
    name: z.string(),
    bestFor: z.array(z.string()).default([]),
    durability: z.enum(['low', 'medium', 'high']),
    recyclability: z.enum(['low', 'medium', 'high']),
    summary: z.string(),
    ...translationFields
  })
});

export const collections = { guides, fixability, materials };

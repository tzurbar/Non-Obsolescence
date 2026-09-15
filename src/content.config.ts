import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Every collection carries the same translation-tracking fields:
// - translationStatus 'original' (source content) | 'machine' (auto-translated draft) | 'reviewed' (human-checked)
// - translationOf: the source entry's id (e.g. "en/replace-a-lightbulb"), unset for original content
// - sourceUpdated: the source's publishDate/updated value at translation time, used to detect stale translations
const translationFields = {
  translationStatus: z.enum(['original', 'machine', 'reviewed']).default('original'),
  translationOf: z.string().optional(),
  sourceUpdated: z.coerce.date().optional(),
  // Hash of the English source's translatable fields at translation time.
  // This, not sourceUpdated, is what scripts/translate.mjs compares to decide
  // a translation is stale - timestamps don't survive a git checkout.
  sourceHash: z.string().optional()
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

// One tree per domain (guides / fixability / materials) - a category is a
// node with an optional parentId pointing at another category in the same
// domain+locale. No depth limit; the manager UI is how these get authored.
const category = z.object({
  label: z.string(),
  parentId: z.string().optional(),
  ...translationFields
});

const categoriesGuides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/categories-guides' }),
  schema: category
});

const categoriesFixability = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/categories-fixability' }),
  schema: category
});

const categoriesMaterials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/categories-materials' }),
  schema: category
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    productName: z.string(),
    categoryId: z.string(),
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
    categoryId: z.string(),
    score: z.number().min(0).max(10),
    summary: z.string(),
    sources: z.array(z.string()).default([]),
    updated: z.date(),
    ...translationFields
  })
});

// Comparable ratings rather than prose, so two materials can be read
// side by side. Deliberately coarse - "high/medium/low" is honest about
// how precise a general-purpose reference can be, where a real number
// would imply a precision that depends on grade, treatment and load case.
const rating = z.enum(['low', 'medium', 'high']);

const materials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/materials' }),
  schema: z.object({
    name: z.string(),
    categoryId: z.string().optional(),
    bestFor: z.array(z.string()).default([]),
    durability: rating,
    recyclability: rating,
    // Pull vs push are called out separately because that difference is
    // the whole story for several of these (concrete, cast iron).
    tensileStrength: rating.optional(),
    compressiveStrength: rating.optional(),
    flexibility: rating.optional(),
    waterResistance: rating.optional(),
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    summary: z.string(),
    ...translationFields
  })
});

export const collections = { guides, fixability, materials, categoriesGuides, categoriesFixability, categoriesMaterials };

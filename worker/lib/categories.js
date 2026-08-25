// Tree helpers for the manager's category pickers/management pages.
// Mirrors src/lib/categories.ts (kept separate for the same reason as
// content-format.js/translate.js - Workers bundle standalone, no access to
// astro:content or the src/ tree).

import { listDirectory, getFile, putFile } from './github.js';
import { parseFrontmatter, buildCategoryMarkdown, slugify } from './content-format.js';
import { translateEntry, TARGET_LOCALES } from './translate.js';

export function flattenIndented(entries) {
  const byParent = new Map();
  for (const e of entries) {
    const key = e.data.parentId || undefined;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(e);
  }
  for (const list of byParent.values()) list.sort((a, b) => a.data.label.localeCompare(b.data.label));

  const result = [];
  const seen = new Set();
  function walk(parentId, depth) {
    for (const e of byParent.get(parentId) || []) {
      if (seen.has(e.slug)) continue;
      seen.add(e.slug);
      result.push({ slug: e.slug, label: e.data.label, depth, parentId: e.data.parentId });
      walk(e.slug, depth + 1);
    }
  }
  walk(undefined, 0);
  return result;
}

export function descendantSlugs(entries, rootSlug) {
  const children = new Map();
  for (const e of entries) {
    const p = e.data.parentId;
    if (p) {
      if (!children.has(p)) children.set(p, []);
      children.get(p).push(e.slug);
    }
  }
  const result = new Set();
  function walk(slug) {
    if (result.has(slug)) return;
    result.add(slug);
    for (const child of children.get(slug) || []) walk(child);
  }
  walk(rootSlug);
  return result;
}

export const DOMAIN_FOLDERS = {
  guides: 'categories-guides',
  fixability: 'categories-fixability',
  materials: 'categories-materials'
};

export async function listCategories(repo, token, domain) {
  const folder = DOMAIN_FOLDERS[domain];
  const files = await listDirectory(repo, token, `src/content/${folder}/en`);
  const entries = [];
  for (const f of files.filter((f) => f.name.endsWith('.md'))) {
    const file = await getFile(repo, token, f.path);
    entries.push({ slug: f.name.replace(/\.md$/, ''), data: parseFrontmatter(file.content).data });
  }
  return entries;
}

// Creates a category (English source) and its machine-translated drafts in
// every other locale, same as guides/fixability/materials get translated
// the moment they're saved.
export async function createCategory({ repo, token, env, domain, label, parentId, existingCategories }) {
  const folder = DOMAIN_FOLDERS[domain];
  let slug = slugify(label);
  if (existingCategories.some((c) => c.slug === slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const markdown = buildCategoryMarkdown({ label, parentId: parentId || undefined });
  await putFile(repo, token, `src/content/${folder}/en/${slug}.md`, markdown, `Add category: ${label}`);

  for (const locale of TARGET_LOCALES) {
    const translated = await translateEntry({ data: { label }, fields: ['label'], env, targetLocale: locale });
    const draftMarkdown = buildCategoryMarkdown({ label: translated.label, parentId: parentId || undefined }, 'machine');
    await putFile(repo, token, `src/content/${folder}/${locale}/${slug}.md`, draftMarkdown, `Add ${locale} draft for category: ${label}`);
  }

  return slug;
}

// Handles the "pick an existing category OR type a new one" pattern used
// on every guide/fixability/materials form. If newCategoryLabel is filled
// in, creates that category (as a child of newCategoryParentId, or
// top-level) and returns its slug; otherwise returns whatever was picked
// in the categoryId select.
export async function resolveCategoryId({ repo, token, env, domain, form, existingCategories }) {
  const newLabel = (form.get('newCategoryLabel') || '').trim();
  if (!newLabel) return form.get('categoryId') || '';
  return createCategory({ repo, token, env, domain, label: newLabel, parentId: form.get('newCategoryParentId'), existingCategories });
}

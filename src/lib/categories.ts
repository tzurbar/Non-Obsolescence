// Tree helpers shared by every page that browses/filters by category.
// A "category entry" here is anything with { id, data: { label, parentId? } }
// - i.e. a CollectionEntry from one of the categoriesGuides/Fixability/Materials
// collections, already filtered to one locale.
//
// categoryId/parentId are stored as bare slugs (no locale prefix, e.g.
// "kitchen" not "en/kitchen") - the tree structure is locale-independent,
// only the labels get translated, so the same id is reused across every
// locale's copy of a category. This must match worker/lib/categories.js,
// which writes parentId this way. Use slugOf() to strip the locale prefix
// off a CollectionEntry.id before comparing it to a stored categoryId.

import { slugOf } from './content';

interface CategoryLike {
  id: string;
  data: { label: string; parentId?: string };
}

export interface CategoryNode {
  id: string;
  label: string;
  depth: number;
  parentId?: string;
}

// Parent-before-children order, with depth for indentation. Cycles (bad
// data) are broken by refusing to revisit an id already placed.
export function flattenIndented(entries: CategoryLike[]): CategoryNode[] {
  const byParent = new Map<string | undefined, CategoryLike[]>();
  for (const e of entries) {
    const key = e.data.parentId || undefined;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(e);
  }
  for (const list of byParent.values()) list.sort((a, b) => a.data.label.localeCompare(b.data.label));

  const result: CategoryNode[] = [];
  const seen = new Set<string>();
  function walk(parentId: string | undefined, depth: number) {
    for (const e of byParent.get(parentId) || []) {
      const slug = slugOf(e.id);
      if (seen.has(slug)) continue;
      seen.add(slug);
      result.push({ id: slug, label: e.data.label, depth, parentId: e.data.parentId });
      walk(slug, depth + 1);
    }
  }
  walk(undefined, 0);
  return result;
}

// The category itself plus every descendant - what "show me everything
// under Kitchen" means when filtering a listing page.
export function descendantIds(entries: CategoryLike[], rootId: string): Set<string> {
  const children = new Map<string, string[]>();
  for (const e of entries) {
    const p = e.data.parentId;
    if (p) {
      if (!children.has(p)) children.set(p, []);
      children.get(p)!.push(slugOf(e.id));
    }
  }
  const result = new Set<string>();
  function walk(id: string) {
    if (result.has(id)) return;
    result.add(id);
    for (const child of children.get(id) || []) walk(child);
  }
  walk(rootId);
  return result;
}

// This node's id plus every ancestor's id, up to the root. Used to tag each
// item client-side so selecting a parent category ("Timber") also matches
// items tagged with a child ("Oak") without recomputing descendants per item.
export function ancestorChainIds(entries: CategoryLike[], id: string): string[] {
  const byId = new Map(entries.map((e) => [slugOf(e.id), e]));
  const chain: string[] = [];
  let current: string | undefined = id;
  const seen = new Set<string>();
  while (current && byId.has(current) && !seen.has(current)) {
    seen.add(current);
    chain.push(current);
    current = byId.get(current)!.data.parentId;
  }
  return chain;
}

export function breadcrumb(entries: CategoryLike[], id: string): string {
  const byId = new Map(entries.map((e) => [slugOf(e.id), e]));
  const parts: string[] = [];
  let current: string | undefined = id;
  const seen = new Set<string>();
  while (current && byId.has(current) && !seen.has(current)) {
    seen.add(current);
    const node = byId.get(current)!;
    parts.unshift(node.data.label);
    current = node.data.parentId;
  }
  return parts.join(' > ');
}

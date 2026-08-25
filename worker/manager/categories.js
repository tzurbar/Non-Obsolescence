import { listDirectory, getFile, deleteFile } from '../lib/github.js';
import { parseFrontmatter } from '../lib/content-format.js';
import { escapeHtml, page, field, readFormBody } from '../lib/html.js';
import { flattenIndented, listCategories, createCategory, DOMAIN_FOLDERS } from '../lib/categories.js';

const DOMAIN_LABELS = { guides: 'Guides', fixability: 'Fixability', materials: 'Materials' };
const ITEM_COLLECTIONS = { guides: 'guides', fixability: 'fixability', materials: 'materials' };

async function itemsUsingCategory(repo, token, domain, categorySlug) {
  const collection = ITEM_COLLECTIONS[domain];
  const files = await listDirectory(repo, token, `src/content/${collection}/en`).catch(() => []);
  let count = 0;
  for (const f of files.filter((f) => f.name.endsWith('.md'))) {
    const file = await getFile(repo, token, f.path);
    if (parseFrontmatter(file.content).data.categoryId === categorySlug) count++;
  }
  return count;
}

async function pageHtml({ repo, token, domain, flash }) {
  const entries = await listCategories(repo, token, domain);
  const nodes = flattenIndented(entries);
  const indent = (depth) => '&nbsp;&nbsp;'.repeat(depth) + (depth > 0 ? '↳ ' : '');

  const rows = nodes.length
    ? nodes
        .map(
          (n) => `<div class="border border-stone-200 rounded-lg p-3 mb-2 flex items-center justify-between">
        <span>${indent(n.depth)}${escapeHtml(n.label)}</span>
        <form method="POST" action="/manager/data/categories/${domain}/${n.slug}/delete" onsubmit="return confirm('Delete this category? Only works if it has no subcategories and nothing is using it.')">
          <button type="submit" class="btn-danger">Delete</button>
        </form>
      </div>`
        )
        .join('\n')
    : '<p class="text-stone-500">No categories yet.</p>';

  const parentOptions = `<option value="">— top level —</option>` + nodes.map((n) => `<option value="${n.slug}">${indent(n.depth)}${escapeHtml(n.label)}</option>`).join('');

  return `<div class="max-w-2xl mx-auto px-4 py-12">
    <a href="/manager/data" class="text-sm text-stone-500 hover:text-emerald-700">&larr; Back to Data</a>
    <h1 class="text-2xl font-bold mt-2 mb-1">${DOMAIN_LABELS[domain]} categories</h1>
    <p class="text-sm text-stone-500 mb-6">This tree is used to categorize ${DOMAIN_LABELS[domain].toLowerCase()} entries. New categories are auto-translated into every language.</p>

    ${rows}

    <div class="border border-stone-200 rounded-lg p-4 mt-6">
      <h2 class="font-semibold text-sm mb-3">Add a category</h2>
      <form method="POST" action="/manager/data/categories/${domain}/add" class="space-y-3">
        ${field('Label', 'label', '', { placeholder: 'e.g. Kitchen, or Tap (as a child of Kitchen)' })}
        <label class="block">
          <span class="field-label">Parent (optional)</span>
          <select name="parentId" class="mt-1">${parentOptions}</select>
        </label>
        <button type="submit" class="bg-emerald-700 text-white font-semibold px-6 py-2 rounded-lg hover:bg-emerald-800 transition text-sm">Add category</button>
      </form>
    </div>
  </div>`;
}

export const routes = {
  async list({ repo, token, domain, url }) {
    return page({ title: `${DOMAIN_LABELS[domain]} categories`, body: await pageHtml({ repo, token, domain }), flash: url.searchParams.get('flash'), activeTab: 'data' });
  },
  async add({ repo, token, env, request, domain }) {
    const form = await readFormBody(request);
    const label = (form.get('label') || '').trim();
    if (!label) return { redirect: `/manager/data/categories/${domain}?flash=${encodeURIComponent('Label is required.')}` };
    const existingCategories = await listCategories(repo, token, domain);
    await createCategory({ repo, token, env, domain, label, parentId: form.get('parentId'), existingCategories });
    return { redirect: `/manager/data/categories/${domain}?flash=${encodeURIComponent(`Added "${label}".`)}` };
  },
  async delete({ repo, token, domain, slug }) {
    const entries = await listCategories(repo, token, domain);
    const hasChildren = entries.some((c) => c.data.parentId === slug);
    if (hasChildren) {
      return { redirect: `/manager/data/categories/${domain}?flash=${encodeURIComponent("Can't delete - it has subcategories. Delete or move those first.")}` };
    }
    const inUse = await itemsUsingCategory(repo, token, domain, slug);
    if (inUse > 0) {
      return { redirect: `/manager/data/categories/${domain}?flash=${encodeURIComponent(`Can't delete - ${inUse} ${ITEM_COLLECTIONS[domain]} entr${inUse === 1 ? 'y is' : 'ies are'} using it.`)}` };
    }
    const folder = DOMAIN_FOLDERS[domain];
    for (const locale of ['en', 'he', 'ar', 'es', 'pt']) {
      const path = `src/content/${folder}/${locale}/${slug}.md`;
      const existing = await getFile(repo, token, path);
      if (existing) await deleteFile(repo, token, path, existing.sha, `Delete category: ${slug}`);
    }
    return { redirect: `/manager/data/categories/${domain}?flash=${encodeURIComponent('Deleted.')}` };
  }
};

import { listDirectory, getFile, putFile, deleteFile } from '../lib/github.js';
import { slugify, buildFixabilityMarkdown, buildMaterialsMarkdown, parseFrontmatter } from '../lib/content-format.js';
import { escapeHtml, page, field, textareaField, selectField, categoryPickerFields, readFormBody } from '../lib/html.js';
import { translateEntry, TARGET_LOCALES } from '../lib/translate.js';
import { flattenIndented, listCategories, resolveCategoryId } from '../lib/categories.js';

const FIELDS = {
  fixability: { fields: ['summary'], build: buildFixabilityMarkdown, domain: 'fixability' },
  materials: { fields: ['name', 'bestFor', 'summary'], build: buildMaterialsMarkdown, domain: 'materials' }
};

async function listEntries(repo, token, collection) {
  const files = await listDirectory(repo, token, `src/content/${collection}/en`);
  const entries = [];
  for (const f of files.filter((f) => f.name.endsWith('.md'))) {
    const file = await getFile(repo, token, f.path);
    entries.push({ slug: f.name.replace(/\.md$/, ''), data: parseFrontmatter(file.content).data });
  }
  return entries;
}

function labelFor(categoryEntries, categoryId) {
  const entry = categoryEntries.find((c) => c.slug === categoryId);
  return entry ? entry.data.label : categoryId ? '(unknown category)' : '(uncategorized)';
}

async function listHtml(repo, token) {
  const [fixability, materials, fixCats, matCats] = await Promise.all([
    listEntries(repo, token, 'fixability'),
    listEntries(repo, token, 'materials'),
    listCategories(repo, token, 'fixability'),
    listCategories(repo, token, 'materials')
  ]);

  const fixabilityCards = fixability
    .map(
      (e) => `<div class="border border-stone-200 rounded-lg p-5 mb-4" data-category="${escapeHtml(e.data.categoryId || '')}" data-search="${escapeHtml((e.data.brand + ' ' + labelFor(fixCats, e.data.categoryId)).toLowerCase())}">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">${escapeHtml(e.data.brand)} &mdash; ${escapeHtml(labelFor(fixCats, e.data.categoryId))}</h3>
          <span class="text-emerald-700 font-bold">${Number(e.data.score).toFixed(1)}/10</span>
        </div>
        <p class="mt-2 text-sm text-stone-600">${escapeHtml(e.data.summary)}</p>
        <div class="mt-3 flex gap-2">
          <a href="/manager/data/fixability/${e.slug}" class="text-sm text-emerald-700 hover:underline">Edit</a>
          <form class="inline-delete" method="POST" action="/manager/data/fixability/${e.slug}/delete" onsubmit="return confirm('Delete this entry?')">
            <button type="submit" class="btn-danger">Delete</button>
          </form>
        </div>
      </div>`
    )
    .join('\n');

  const materialsCards = materials
    .map(
      (e) => `<div class="border border-stone-200 rounded-lg p-5 mb-4" data-category="${escapeHtml(e.data.categoryId || '')}" data-search="${escapeHtml((e.data.name + ' ' + labelFor(matCats, e.data.categoryId)).toLowerCase())}">
        <h3 class="font-semibold">${escapeHtml(e.data.name)}</h3>
        <p class="mt-1 text-xs text-stone-500 uppercase tracking-wide">${escapeHtml(labelFor(matCats, e.data.categoryId))} &middot; Durability: ${e.data.durability} &middot; Recyclability: ${e.data.recyclability}</p>
        <p class="mt-2 text-sm text-stone-600">${escapeHtml(e.data.summary)}</p>
        <div class="mt-3 flex gap-2">
          <a href="/manager/data/materials/${e.slug}" class="text-sm text-emerald-700 hover:underline">Edit</a>
          <form class="inline-delete" method="POST" action="/manager/data/materials/${e.slug}/delete" onsubmit="return confirm('Delete this entry?')">
            <button type="submit" class="btn-danger">Delete</button>
          </form>
        </div>
      </div>`
    )
    .join('\n');

  return `<div class="max-w-3xl mx-auto px-4 py-12">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold">Fixability by Brand</h1>
      <div class="flex gap-2">
        <a href="/manager/data/categories/fixability" class="text-sm text-emerald-700 hover:underline" style="align-self:center">Manage categories</a>
        <a href="/manager/data/fixability/new" class="bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-800 transition text-sm">+ Add entry</a>
      </div>
    </div>
    ${fixabilityCards || '<p class="text-stone-500">No entries yet.</p>'}
    <div class="flex items-center justify-between mb-4 mt-10">
      <h1 class="text-2xl font-bold">Materials Reference</h1>
      <div class="flex gap-2">
        <a href="/manager/data/categories/materials" class="text-sm text-emerald-700 hover:underline" style="align-self:center">Manage categories</a>
        <a href="/manager/data/materials/new" class="bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-800 transition text-sm">+ Add material</a>
      </div>
    </div>
    ${materialsCards || '<p class="text-stone-500">No entries yet.</p>'}
  </div>`;
}

function fixabilityFormHtml(data = {}, slug = '', categoryNodes = []) {
  return `<div class="max-w-2xl mx-auto px-4 py-12">
    <a href="/manager/data" class="text-sm text-stone-500 hover:text-emerald-700">&larr; Back</a>
    <h1 class="text-2xl font-bold mt-2 mb-6">${slug ? 'Edit' : 'Add'} fixability entry</h1>
    <form method="POST" action="/manager/data/fixability/${slug || 'new'}" class="space-y-4">
      ${field('Brand', 'brand', data.brand || '')}
      ${categoryPickerFields(categoryNodes, data.categoryId || '')}
      ${field('Score (0-10)', 'score', data.score ?? '', { type: 'number', step: '0.1' })}
      ${textareaField('Summary', 'summary', data.summary || '', { placeholder: 'What makes this brand/category repairable or not.' })}
      ${textareaField('Sources', 'sources', (data.sources || []).join('\n'), { placeholder: 'One URL per line', rows: 2 })}
      <button type="submit" class="bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-emerald-800 transition">Save</button>
    </form>
  </div>`;
}

function materialsFormHtml(data = {}, slug = '', categoryNodes = []) {
  return `<div class="max-w-2xl mx-auto px-4 py-12">
    <a href="/manager/data" class="text-sm text-stone-500 hover:text-emerald-700">&larr; Back</a>
    <h1 class="text-2xl font-bold mt-2 mb-6">${slug ? 'Edit' : 'Add'} material</h1>
    <form method="POST" action="/manager/data/materials/${slug || 'new'}" class="space-y-4">
      ${field('Name', 'name', data.name || '', { placeholder: 'Solid Hardwood (Oak)' })}
      ${categoryPickerFields(categoryNodes, data.categoryId || '')}
      <div class="grid gap-4 sm:grid-cols-2">
        ${selectField('Durability', 'durability', data.durability || 'medium', ['low', 'medium', 'high'])}
        ${selectField('Recyclability', 'recyclability', data.recyclability || 'medium', ['low', 'medium', 'high'])}
      </div>
      ${textareaField('Best for', 'bestFor', (data.bestFor || []).join('\n'), { placeholder: 'One per line', rows: 3 })}
      ${textareaField('Summary', 'summary', data.summary || '', { placeholder: 'What it is good for and why.' })}
      <button type="submit" class="bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-emerald-800 transition">Save</button>
    </form>
  </div>`;
}

async function translateDataEntry({ repo, token, env, collection, slug, data }) {
  const { fields } = FIELDS[collection];
  for (const locale of TARGET_LOCALES) {
    const path = `src/content/${collection}/${locale}/${slug}.md`;
    const existing = await getFile(repo, token, path);
    if (existing) {
      const existingData = parseFrontmatter(existing.content).data;
      if (existingData.translationStatus === 'reviewed') continue; // never clobber a human-checked translation
    }
    // categoryId isn't in `fields`, so translateEntry passes it through
    // unchanged - the category tree itself is translated separately, by
    // its own entries, when a category is created.
    const translatedData = await translateEntry({ data, fields, env, targetLocale: locale });
    const markdown = FIELDS[collection].build(translatedData, 'machine');
    await putFile(repo, token, path, markdown, `${existing ? 'Update' : 'Add'} ${locale} draft for ${slug}`, existing?.sha);
  }
}

export const routes = {
  async list({ repo, token, url }) {
    return page({ title: 'Data', body: await listHtml(repo, token), flash: url.searchParams.get('flash'), activeTab: 'data' });
  },
  async newForm({ repo, token, collection }) {
    const categoryNodes = flattenIndented(await listCategories(repo, token, FIELDS[collection].domain));
    const html = collection === 'fixability' ? fixabilityFormHtml({}, '', categoryNodes) : materialsFormHtml({}, '', categoryNodes);
    return page({ title: `Add ${collection}`, body: html, flash: null, activeTab: 'data' });
  },
  async editForm({ repo, token, collection, slug }) {
    const [file, categoryNodes] = await Promise.all([
      getFile(repo, token, `src/content/${collection}/en/${slug}.md`),
      listCategories(repo, token, FIELDS[collection].domain).then(flattenIndented)
    ]);
    const data = parseFrontmatter(file.content).data;
    const html = collection === 'fixability' ? fixabilityFormHtml(data, slug, categoryNodes) : materialsFormHtml(data, slug, categoryNodes);
    return page({ title: `Edit ${collection}`, body: html, flash: null, activeTab: 'data' });
  },
  async save({ repo, token, env, request, collection, slugParam }) {
    const form = await readFormBody(request);
    const isNew = slugParam === 'new';
    const domain = FIELDS[collection].domain;
    const existingCategories = await listCategories(repo, token, domain);
    const categoryId = await resolveCategoryId({ repo, token, env, domain, form, existingCategories });

    let data, slug;
    if (collection === 'fixability') {
      data = {
        brand: form.get('brand') || '',
        categoryId,
        score: form.get('score') || '0',
        summary: form.get('summary') || '',
        sources: form.get('sources') || ''
      };
      slug = isNew ? slugify(`${data.brand}`) : slugParam;
    } else {
      data = {
        name: form.get('name') || '',
        categoryId,
        durability: form.get('durability') || 'medium',
        recyclability: form.get('recyclability') || 'medium',
        bestFor: form.get('bestFor') || '',
        summary: form.get('summary') || ''
      };
      slug = isNew ? slugify(data.name) : slugParam;
    }

    const path = `src/content/${collection}/en/${slug}.md`;
    const existing = isNew ? null : await getFile(repo, token, path);
    const markdown = FIELDS[collection].build(data);
    await putFile(repo, token, path, markdown, `${isNew ? 'Add' : 'Update'} ${collection} entry: ${slug}`, existing?.sha);

    await translateDataEntry({ repo, token, env, collection, slug, data });

    return { redirect: `/manager/data?flash=${encodeURIComponent('Saved. Live in a minute or two once the site rebuilds.')}` };
  },
  async delete({ repo, token, collection, slug }) {
    for (const locale of ['en', ...TARGET_LOCALES]) {
      const path = `src/content/${collection}/${locale}/${slug}.md`;
      const existing = await getFile(repo, token, path);
      if (existing) await deleteFile(repo, token, path, existing.sha, `Delete ${collection} entry: ${slug}`);
    }
    return { redirect: `/manager/data?flash=${encodeURIComponent('Deleted.')}` };
  }
};

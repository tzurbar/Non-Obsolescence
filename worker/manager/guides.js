// Manage published guides: browse/search them, edit one, or delete it.
//
// Guides are the only content that arrives by a route other than the
// manager (the public submission form -> approve), so until now there was
// no way to fix a typo or take a guide down again. Everything here works
// on the English source file; the other locales are regenerated from it on
// save and removed alongside it on delete.

import { listDirectory, getFile, putFile, deleteFile } from '../lib/github.js';
import { parseGuideMarkdown, buildGuideMarkdown } from '../lib/content-format.js';
import { escapeHtml, page, field, textareaField, selectField, categoryPickerFields, readFormBody } from '../lib/html.js';
import { translateEntry, translateLinkBlock, TARGET_LOCALES } from '../lib/translate.js';
import { flattenIndented, listCategories, resolveCategoryId } from '../lib/categories.js';

const GUIDE_DIR = 'src/content/guides';

async function listGuides(repo, token) {
  const files = await listDirectory(repo, token, `${GUIDE_DIR}/en`);
  const guides = [];
  for (const file of files.filter((f) => f.name.endsWith('.md'))) {
    const raw = await getFile(repo, token, file.path);
    const { data } = parseGuideMarkdown(raw.content);
    guides.push({ slug: file.name.replace(/\.md$/, ''), data });
  }
  return guides.sort((a, b) => (a.data.title || '').localeCompare(b.data.title || ''));
}

function labelFor(categories, categoryId) {
  const found = categories.find((c) => c.slug === categoryId);
  return found ? found.data.label : categoryId || '(uncategorized)';
}

// Client-side filtering, same idea as the public guides page: everything is
// already on the page, so searching is instant and needs no round trip.
const FILTER_SCRIPT = `
  const search = document.getElementById('guide-search');
  const categorySelect = document.getElementById('guide-category');
  const rows = Array.from(document.querySelectorAll('[data-guide]'));
  const empty = document.getElementById('no-matches');
  function apply() {
    const q = search.value.trim().toLowerCase();
    const cat = categorySelect.value;
    let shown = 0;
    rows.forEach((row) => {
      const matchesText = !q || row.dataset.search.includes(q);
      const matchesCat = !cat || row.dataset.category === cat;
      const show = matchesText && matchesCat;
      row.style.display = show ? '' : 'none';
      if (show) shown++;
    });
    empty.style.display = shown === 0 ? '' : 'none';
  }
  search.addEventListener('input', apply);
  categorySelect.addEventListener('change', apply);
  apply();
`;

async function listHtml(repo, token) {
  const [guides, categoryEntries] = await Promise.all([listGuides(repo, token), listCategories(repo, token, 'guides')]);
  const nodes = flattenIndented(categoryEntries);
  const indent = (depth) => '&nbsp;&nbsp;'.repeat(depth) + (depth > 0 ? '↳ ' : '');

  const rows = guides
    .map((guide) => {
      const category = labelFor(categoryEntries, guide.data.categoryId);
      const searchText = `${guide.data.title} ${guide.data.productName} ${category}`.toLowerCase();
      return `<div class="border border-stone-200 rounded-lg p-5 mb-4" data-guide data-category="${escapeHtml(guide.data.categoryId || '')}" data-search="${escapeHtml(searchText)}">
        <h3 class="font-semibold text-stone-900">${escapeHtml(guide.data.title)}</h3>
        <p class="mt-1 text-sm text-stone-500">${escapeHtml(category)} &middot; ${escapeHtml(guide.data.difficulty || '')} &middot; ${escapeHtml(guide.data.estimatedTime || '')}</p>
        <div class="mt-3 flex gap-2 items-center">
          <a href="/manager/guides/${guide.slug}" class="text-sm text-emerald-700 hover:underline">Edit</a>
          <a href="/guides/${guide.slug}" target="_blank" rel="noopener" class="text-sm text-stone-500 hover:text-emerald-700">View</a>
          <form class="inline-delete" method="POST" action="/manager/guides/${guide.slug}/delete" onsubmit="return confirm('Delete &quot;${escapeHtml(guide.data.title)}&quot; in every language, along with its images? This cannot be undone.')">
            <button type="submit" class="btn-danger">Delete</button>
          </form>
        </div>
      </div>`;
    })
    .join('\n');

  return `<div class="max-w-3xl mx-auto px-4 py-12">
    <h1 class="text-2xl font-bold mb-1">Guides</h1>
    <p class="text-sm text-stone-500 mb-6">${guides.length} published guide${guides.length === 1 ? '' : 's'}. Editing one republishes it and regenerates every translation.</p>
    <!-- Explicit flex sizing: the admin stylesheet puts width:100% on every
         select, which otherwise claims the whole row and collapses the
         search box next to it. type="search" gets the native clear button. -->
    <div class="flex flex-wrap gap-2 mb-6">
      <input id="guide-search" type="search" placeholder="Search guides…" autocomplete="off" style="flex:1 1 12rem; min-width:0">
      <select id="guide-category" style="flex:0 1 auto; width:auto">
        <option value="">All categories</option>
        ${nodes.map((n) => `<option value="${n.slug}">${indent(n.depth)}${escapeHtml(n.label)}</option>`).join('')}
      </select>
    </div>
    ${rows || ''}
    <p id="no-matches" class="text-stone-500" style="display:none">No guides match that search.</p>
    ${guides.length === 0 ? '<p class="text-stone-500">No guides published yet.</p>' : ''}
  </div>
  <script>${FILTER_SCRIPT}</script>`;
}

function stepRowHtml(step = {}) {
  return `<div class="step-row border border-stone-200 rounded-lg p-4 space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold text-stone-500 step-number"></span>
      <button type="button" class="remove-step text-xs text-red-600 hover:underline">Remove</button>
    </div>
    <textarea name="step_text" rows="2" class="step-text" placeholder="What do you do in this step?">${escapeHtml(step.text || '')}</textarea>
    <input type="hidden" name="step_image" value="${escapeHtml(step.image || '')}">
    ${step.image ? `<p class="text-xs text-stone-500">Photo: ${escapeHtml(step.image)}</p>` : ''}
    <div class="grid gap-2 sm:grid-cols-2">
      <input name="step_part" value="${escapeHtml(step.partLink || '')}" placeholder="Part link: Label | URL (optional)">
      <input name="step_video" value="${escapeHtml(step.videoLink || '')}" placeholder="Video link: Label | URL (optional)">
    </div>
  </div>`;
}

const STEP_SCRIPT = `
  const stepsList = document.getElementById('steps-list');
  const stepTemplate = document.getElementById('step-template');
  function renumberSteps() {
    stepsList.querySelectorAll('.step-row').forEach((row, i) => {
      const label = row.querySelector('.step-number');
      if (label) label.textContent = 'Step ' + (i + 1);
    });
  }
  function wireRemove(row) {
    row.querySelector('.remove-step')?.addEventListener('click', () => { row.remove(); renumberSteps(); });
  }
  stepsList.querySelectorAll('.step-row').forEach(wireRemove);
  renumberSteps();
  document.getElementById('add-step')?.addEventListener('click', () => {
    stepsList.appendChild(stepTemplate.content.cloneNode(true));
    wireRemove(stepsList.lastElementChild);
    renumberSteps();
  });
`;

async function editHtml(repo, token, slug) {
  const file = await getFile(repo, token, `${GUIDE_DIR}/en/${slug}.md`);
  if (!file) return null;
  const { data, steps } = parseGuideMarkdown(file.content);
  const categoryNodes = flattenIndented(await listCategories(repo, token, 'guides'));
  const stepsHtml = (steps.length > 0 ? steps : [{}]).map((step) => stepRowHtml(step)).join('\n');

  return `<article class="max-w-3xl mx-auto px-4 py-12">
    <a href="/manager/guides" class="text-sm text-stone-500 hover:text-emerald-700">&larr; All guides</a>
    <h1 class="text-2xl font-bold mt-2 mb-6">Edit guide</h1>
    <form method="POST" action="/manager/guides/${slug}" class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-2">
        ${field('Guide title', 'title', data.title, { wrapperClass: 'sm:col-span-2' })}
        ${field('Product / product type', 'productName', data.productName)}
        ${selectField('Difficulty', 'difficulty', data.difficulty, ['beginner', 'intermediate', 'advanced'])}
        ${field('Estimated time', 'estimatedTime', data.estimatedTime)}
        ${field('Credited to', 'authorName', data.authorName)}
      </div>
      ${categoryPickerFields(categoryNodes, data.categoryId || '')}
      ${textareaField('Tools needed', 'tools', data.tools, { placeholder: 'One per line' })}
      ${data.coverImage ? `<p class="text-xs text-stone-500">Cover photo: ${escapeHtml(data.coverImage)}</p>` : ''}
      <input type="hidden" name="coverImage" value="${escapeHtml(data.coverImage || '')}">
      <input type="hidden" name="publishDate" value="${escapeHtml(data.publishDate || '')}">
      <label class="flex items-center gap-2">
        <input type="checkbox" name="featured" value="true" style="width:auto" ${data.featured ? 'checked' : ''}>
        <span class="text-sm text-stone-700">Show on the home page</span>
      </label>
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="field-label" style="margin:0">Steps</span>
          <button type="button" id="add-step" class="text-sm text-emerald-700 hover:underline">+ Add step</button>
        </div>
        <div id="steps-list" class="space-y-4">${stepsHtml}</div>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        ${textareaField('Part links', 'partLinks', data.partLinks, { placeholder: 'One per line: Label | https://...' })}
        ${textareaField('Video links', 'videoLinks', data.videoLinks, { placeholder: 'One per line: Label | https://...' })}
      </div>
      ${textareaField('Notes', 'notes', data.notes, { rows: 4 })}
      <button type="submit" class="bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-emerald-800 transition">Save &amp; republish</button>
    </form>
    <p class="mt-4 text-xs text-stone-500">Photos can't be changed here yet - existing ones are kept as they are.</p>
  </article>
  <template id="step-template">${stepRowHtml()}</template>
  <script>${STEP_SCRIPT}</script>`;
}

function guideFromForm(form) {
  const data = {
    title: form.get('title') || '',
    productName: form.get('productName') || '',
    difficulty: form.get('difficulty') || 'beginner',
    estimatedTime: form.get('estimatedTime') || '',
    authorName: form.get('authorName') || '',
    tools: form.get('tools') || '',
    partLinks: form.get('partLinks') || '',
    videoLinks: form.get('videoLinks') || '',
    notes: form.get('notes') || ''
  };
  const texts = form.getAll('step_text');
  const images = form.getAll('step_image');
  const parts = form.getAll('step_part');
  const videos = form.getAll('step_video');
  const rows = texts
    .map((text, i) => ({ text, image: images[i] || '', partLink: parts[i] || '', videoLink: videos[i] || '' }))
    .filter((row) => row.text.trim());
  return {
    data,
    steps: rows.map(({ text, partLink, videoLink }) => ({ text, partLink, videoLink })),
    localImagePaths: { cover: form.get('coverImage') || null, steps: rows.map((r) => r.image || null) },
    publishDate: form.get('publishDate') || new Date().toISOString().slice(0, 10),
    featured: form.get('featured') === 'true'
  };
}

// A locale a human has already checked is never overwritten by a re-save -
// same rule scripts/translate.mjs follows.
async function isReviewed(repo, token, path) {
  const existing = await getFile(repo, token, path);
  return !!existing && /^translationStatus:\s*reviewed\s*$/m.test(existing.content);
}

async function republishTranslations({ repo, token, env, slug, data, steps, localImagePaths, publishDate, featured }) {
  for (const locale of TARGET_LOCALES) {
    const path = `${GUIDE_DIR}/${locale}/${slug}.md`;
    if (await isReviewed(repo, token, path)) continue;
    const translated = await translateEntry({
      data,
      fields: ['title', 'productName', 'estimatedTime', 'tools', 'notes'],
      env,
      targetLocale: locale
    });
    translated.partLinks = await translateLinkBlock(data.partLinks, { env, targetLocale: locale });
    translated.videoLinks = await translateLinkBlock(data.videoLinks, { env, targetLocale: locale });
    const translatedSteps = [];
    for (const step of steps) {
      const { text } = await translateEntry({ data: { text: step.text }, fields: ['text'], env, targetLocale: locale });
      translatedSteps.push({
        text,
        partLink: await translateLinkBlock(step.partLink, { env, targetLocale: locale }),
        videoLink: await translateLinkBlock(step.videoLink, { env, targetLocale: locale })
      });
    }
    const markdown = buildGuideMarkdown({
      data: { ...translated, featured },
      steps: translatedSteps,
      localImagePaths,
      publishDate,
      translationStatus: 'machine'
    });
    const existing = await getFile(repo, token, path);
    await putFile(repo, token, path, markdown, `Update ${locale} draft for ${slug}`, existing?.sha);
  }
}

export const routes = {
  async list({ repo, token, url }) {
    return page({ title: 'Guides', body: await listHtml(repo, token), flash: url.searchParams.get('flash'), activeTab: 'guides' });
  },

  async editForm({ repo, token, slug }) {
    const body = await editHtml(repo, token, slug);
    if (!body) return page({ title: 'Not found', body: '<p class="max-w-3xl mx-auto px-4 py-12 text-stone-500">That guide no longer exists.</p>', flash: null, activeTab: 'guides' });
    return page({ title: 'Edit guide', body, flash: null, activeTab: 'guides' });
  },

  async save({ repo, token, env, request, slug }) {
    const form = await readFormBody(request);
    const { data, steps, localImagePaths, publishDate, featured } = guideFromForm(form);

    const existingCategories = await listCategories(repo, token, 'guides');
    data.categoryId = await resolveCategoryId({ repo, token, env, domain: 'guides', form, existingCategories });

    // The slug stays put even if the title changes: it's the guide's public
    // URL and the folder its images live in.
    const path = `${GUIDE_DIR}/en/${slug}.md`;
    const existing = await getFile(repo, token, path);
    const markdown = buildGuideMarkdown({ data: { ...data, featured }, steps, localImagePaths, publishDate });
    await putFile(repo, token, path, markdown, `Update guide: ${slug}`, existing?.sha);

    await republishTranslations({ repo, token, env, slug, data, steps, localImagePaths, publishDate, featured });

    return { redirect: `/manager/guides?flash=${encodeURIComponent(`Saved "${data.title}". Live in a minute or two once the site rebuilds.`)}` };
  },

  async delete({ repo, token, slug }) {
    let removed = 0;
    for (const locale of ['en', ...TARGET_LOCALES]) {
      const path = `${GUIDE_DIR}/${locale}/${slug}.md`;
      const existing = await getFile(repo, token, path);
      if (existing) {
        await deleteFile(repo, token, path, existing.sha, `Delete guide: ${slug} (${locale})`);
        removed++;
      }
    }

    // Images live in their own folder per guide, so they'd otherwise be
    // orphaned in the repo forever.
    const images = await listDirectory(repo, token, `public/guides/${slug}`).catch(() => []);
    for (const image of images) {
      if (image.type === 'file') await deleteFile(repo, token, image.path, image.sha, `Delete image for removed guide: ${slug}`);
    }

    return { redirect: `/manager/guides?flash=${encodeURIComponent(`Deleted "${slug}" (${removed} language${removed === 1 ? '' : 's'}, ${images.length} image${images.length === 1 ? '' : 's'}).`)}` };
  }
};

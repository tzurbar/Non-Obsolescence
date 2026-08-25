// Local-only editor for the Data page content (fixability + materials
// entries). Run: npm run data:edit, then open http://127.0.0.1:5680
//
// Binds to 127.0.0.1 only, same reasoning as the guide review tool: it
// writes directly to files in this repo, so it only makes sense running on
// your own machine, and there's nothing to expose publicly.
//
// Unlike guide submissions, there's no GitHub issue/review step here - you
// ARE the source, so saving writes the English entry immediately and kicks
// off the same translate script the guide review tool uses, so drafts in
// other languages stay in sync.

import http from 'node:http';
import { readdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { ROOT, slugify, yamlString, runTranslate, resolveLocalCategoryId } from './review-lib.mjs';

const PORT = 5680;

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadSiteCss() {
  try {
    const dir = path.join(ROOT, 'dist', '_astro');
    const files = (await readdir(dir)).filter((f) => f.startsWith('content.') && f.endsWith('.css'));
    if (files.length === 0) return null;
    return await readFile(path.join(dir, files[0]), 'utf-8');
  } catch {
    return null;
  }
}

const ADMIN_CSS = `
  body { background: #fafaf9; }
  .admin-header { background: white; border-bottom: 1px solid #e7e5e4; padding: 1rem 1.5rem; }
  .admin-header a { color: #047857; font-weight: 700; text-decoration: none; }
  .flash { background: #d1fae5; border: 1px solid #6ee7b7; color: #065f46; padding: 0.75rem 1rem; border-radius: 8px; margin: 0 auto 1.5rem; max-width: 48rem; }
  .btn-danger { background: white; color: #dc2626; border: 1px solid #fecaca; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 8px; cursor: pointer; font-size: 0.8rem; }
  .btn-danger:hover { background: #fef2f2; }
  .field-label { display: block; font-size: 0.875rem; font-weight: 600; color: #44403c; margin-bottom: 0.25rem; }
  form.inline-delete { display: inline; }
`;

function page(title, body, flash, siteCss) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)} · Data Editor</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${siteCss ? `<style>${siteCss}</style>` : '<!-- no compiled site CSS found - run "npm run build" first -->'}
<style>${ADMIN_CSS}</style>
</head>
<body class="min-h-screen text-stone-900">
<header class="admin-header"><a href="/">Data Editor</a></header>
<main>
${flash ? `<div class="flash">${escapeHtml(flash)}</div>` : ''}
${body}
</main>
</body>
</html>`;
}

function field(label, name, value, opts = {}) {
  const { placeholder = '', type = 'text', step } = opts;
  return `<label class="block">
    <span class="field-label">${escapeHtml(label)}</span>
    <input type="${type}" ${step ? `step="${step}"` : ''} name="${name}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" class="mt-1 w-full border border-stone-300 rounded-md px-3 py-2" />
  </label>`;
}

function textareaField(label, name, value, opts = {}) {
  const { placeholder = '', rows = 3 } = opts;
  return `<label class="block">
    <span class="field-label">${escapeHtml(label)}</span>
    <textarea name="${name}" rows="${rows}" placeholder="${escapeHtml(placeholder)}" class="mt-1 w-full border border-stone-300 rounded-md px-3 py-2">${escapeHtml(value)}</textarea>
  </label>`;
}

function selectField(label, name, value, options) {
  return `<label class="block">
    <span class="field-label">${escapeHtml(label)}</span>
    <select name="${name}" class="mt-1 w-full border border-stone-300 rounded-md px-3 py-2 bg-white">
      ${options.map((o) => `<option value="${o}" ${o === value ? 'selected' : ''}>${o[0].toUpperCase()}${o.slice(1)}</option>`).join('')}
    </select>
  </label>`;
}

async function listEntries(collection) {
  const dir = path.join(ROOT, 'src', 'content', collection, 'en');
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md'));
  const entries = [];
  for (const file of files) {
    const raw = await readFile(path.join(dir, file), 'utf-8');
    entries.push({ slug: file.replace(/\.md$/, ''), data: matter(raw).data });
  }
  return entries;
}

async function listHtml() {
  const [fixability, materials] = await Promise.all([listEntries('fixability'), listEntries('materials')]);

  const fixabilityCards = fixability
    .map(
      (e) => `<div class="border border-stone-200 rounded-lg p-5 mb-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">${escapeHtml(e.data.brand)} &mdash; ${escapeHtml(e.data.categoryId || '(uncategorized)')}</h3>
          <span class="text-emerald-700 font-bold">${Number(e.data.score).toFixed(1)}/10</span>
        </div>
        <p class="mt-2 text-sm text-stone-600">${escapeHtml(e.data.summary)}</p>
        <div class="mt-3 flex gap-2">
          <a href="/fixability/edit/${e.slug}" class="text-sm text-emerald-700 hover:underline">Edit</a>
          <form class="inline-delete" method="POST" action="/fixability/delete/${e.slug}" onsubmit="return confirm('Delete this entry?')">
            <button type="submit" class="btn-danger">Delete</button>
          </form>
        </div>
      </div>`
    )
    .join('\n');

  const materialsCards = materials
    .map(
      (e) => `<div class="border border-stone-200 rounded-lg p-5 mb-4">
        <h3 class="font-semibold">${escapeHtml(e.data.name)}</h3>
        <p class="mt-1 text-xs text-stone-500 uppercase tracking-wide">Durability: ${e.data.durability} &middot; Recyclability: ${e.data.recyclability}</p>
        <p class="mt-2 text-sm text-stone-600">${escapeHtml(e.data.summary)}</p>
        <div class="mt-3 flex gap-2">
          <a href="/materials/edit/${e.slug}" class="text-sm text-emerald-700 hover:underline">Edit</a>
          <form class="inline-delete" method="POST" action="/materials/delete/${e.slug}" onsubmit="return confirm('Delete this entry?')">
            <button type="submit" class="btn-danger">Delete</button>
          </form>
        </div>
      </div>`
    )
    .join('\n');

  return `<div class="max-w-3xl mx-auto px-4 py-12">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold">Fixability by Brand</h1>
      <a href="/fixability/new" class="bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-800 transition text-sm">+ Add entry</a>
    </div>
    ${fixabilityCards || '<p class="text-stone-500">No entries yet.</p>'}

    <div class="flex items-center justify-between mb-4 mt-10">
      <h1 class="text-2xl font-bold">Materials Reference</h1>
      <a href="/materials/new" class="bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-800 transition text-sm">+ Add material</a>
    </div>
    ${materialsCards || '<p class="text-stone-500">No entries yet.</p>'}
  </div>`;
}

function fixabilityFormHtml(data = {}, slug = '') {
  return `<div class="max-w-2xl mx-auto px-4 py-12">
    <a href="/" class="text-sm text-stone-500 hover:text-emerald-700">&larr; Back</a>
    <h1 class="text-2xl font-bold mt-2 mb-6">${slug ? 'Edit' : 'Add'} fixability entry</h1>
    <form method="POST" action="/fixability/save" class="space-y-4">
      <input type="hidden" name="slug" value="${escapeHtml(slug)}">
      <div class="grid gap-4 sm:grid-cols-2">
        ${field('Brand', 'brand', data.brand || '')}
        ${field('Category ID', 'categoryId', data.categoryId || '', { placeholder: 'slug from a categories-fixability/en file, or use the web manager’s picker instead' })}
      </div>
      ${field('Score (0-10)', 'score', data.score ?? '', { type: 'number', step: '0.1' })}
      ${textareaField('Summary', 'summary', data.summary || '', { placeholder: 'What makes this brand/category repairable or not - screws vs adhesive, spare parts, parts pairing, etc.' })}
      ${textareaField('Sources', 'sources', (data.sources || []).join('\n'), { placeholder: 'One URL per line', rows: 2 })}
      <button type="submit" class="bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-emerald-800 transition">Save</button>
    </form>
  </div>`;
}

function materialsFormHtml(data = {}, slug = '') {
  return `<div class="max-w-2xl mx-auto px-4 py-12">
    <a href="/" class="text-sm text-stone-500 hover:text-emerald-700">&larr; Back</a>
    <h1 class="text-2xl font-bold mt-2 mb-6">${slug ? 'Edit' : 'Add'} material</h1>
    <form method="POST" action="/materials/save" class="space-y-4">
      <input type="hidden" name="slug" value="${escapeHtml(slug)}">
      ${field('Name', 'name', data.name || '', { placeholder: 'Solid Hardwood (Oak)' })}
      ${field('Category ID', 'categoryId', data.categoryId || '', { placeholder: 'slug from a categories-materials/en file, or use the web manager’s picker instead' })}
      <div class="grid gap-4 sm:grid-cols-2">
        ${selectField('Durability', 'durability', data.durability || 'medium', ['low', 'medium', 'high'])}
        ${selectField('Recyclability', 'recyclability', data.recyclability || 'medium', ['low', 'medium', 'high'])}
      </div>
      ${textareaField('Best for', 'bestFor', (data.bestFor || []).join('\n'), { placeholder: 'One per line: Furniture frames, Shelving, Tool handles...', rows: 3 })}
      ${textareaField('Summary', 'summary', data.summary || '', { placeholder: 'What it is good for and why, compared to cheaper alternatives.' })}
      <button type="submit" class="bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-emerald-800 transition">Save</button>
    </form>
  </div>`;
}

function buildFixabilityMarkdown(data, existing) {
  const lines = ['---'];
  lines.push(`brand: ${yamlString(data.brand)}`);
  lines.push(`categoryId: ${yamlString(data.categoryId)}`);
  lines.push(`score: ${Number(data.score)}`);
  lines.push(`summary: >\n  ${data.summary.trim().replace(/\n/g, '\n  ')}`);
  const sources = data.sources.split('\n').map((s) => s.trim()).filter(Boolean);
  if (sources.length > 0) {
    lines.push('sources:');
    sources.forEach((s) => lines.push(`  - ${yamlString(s)}`));
  } else {
    lines.push('sources: []');
  }
  lines.push(`updated: ${new Date().toISOString().slice(0, 10)}`);
  if (existing?.translationStatus) lines.push(`translationStatus: ${existing.translationStatus}`);
  lines.push('---');
  return lines.join('\n') + '\n';
}

function buildMaterialsMarkdown(data, existing) {
  const lines = ['---'];
  lines.push(`name: ${yamlString(data.name)}`);
  if (data.categoryId) lines.push(`categoryId: ${yamlString(data.categoryId)}`);
  const bestFor = data.bestFor.split('\n').map((s) => s.trim()).filter(Boolean);
  if (bestFor.length > 0) {
    lines.push('bestFor:');
    bestFor.forEach((s) => lines.push(`  - ${yamlString(s)}`));
  } else {
    lines.push('bestFor: []');
  }
  lines.push(`durability: ${data.durability}`);
  lines.push(`recyclability: ${data.recyclability}`);
  lines.push(`summary: >\n  ${data.summary.trim().replace(/\n/g, '\n  ')}`);
  if (existing?.translationStatus) lines.push(`translationStatus: ${existing.translationStatus}`);
  lines.push('---');
  return lines.join('\n') + '\n';
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return new URLSearchParams(Buffer.concat(chunks).toString());
}

async function deleteAcrossLocales(collection, slug) {
  const collectionDir = path.join(ROOT, 'src', 'content', collection);
  if (!existsSync(collectionDir)) return;
  const locales = await readdir(collectionDir);
  for (const locale of locales) {
    const file = path.join(collectionDir, locale, `${slug}.md`);
    if (existsSync(file)) await unlink(file);
  }
}

async function main() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    try {
      if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(page('Data', await listHtml(), url.searchParams.get('flash'), await loadSiteCss()));
        return;
      }

      for (const collection of ['fixability', 'materials']) {
        if (req.method === 'GET' && url.pathname === `/${collection}/new`) {
          const html = collection === 'fixability' ? fixabilityFormHtml() : materialsFormHtml();
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(page(`Add ${collection}`, html, null, await loadSiteCss()));
          return;
        }

        const editMatch = url.pathname.match(new RegExp(`^/${collection}/edit/(.+)$`));
        if (req.method === 'GET' && editMatch) {
          const slug = decodeURIComponent(editMatch[1]);
          const file = path.join(ROOT, 'src', 'content', collection, 'en', `${slug}.md`);
          const raw = await readFile(file, 'utf-8');
          const data = matter(raw).data;
          const html = collection === 'fixability' ? fixabilityFormHtml(data, slug) : materialsFormHtml(data, slug);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(page(`Edit ${collection}`, html, null, await loadSiteCss()));
          return;
        }

        if (req.method === 'POST' && url.pathname === `/${collection}/save`) {
          const form = await readBody(req);
          const slugInput = form.get('slug');
          let existing = null;
          if (slugInput) {
            const file = path.join(ROOT, 'src', 'content', collection, 'en', `${slugInput}.md`);
            if (existsSync(file)) existing = matter(await readFile(file, 'utf-8')).data;
          }

          let markdown, slug;
          if (collection === 'fixability') {
            const data = {
              brand: form.get('brand') || '',
              categoryId: await resolveLocalCategoryId('fixability', { categoryId: form.get('categoryId') }),
              score: form.get('score') || '0',
              summary: form.get('summary') || '',
              sources: form.get('sources') || ''
            };
            slug = slugInput || slugify(data.brand);
            markdown = buildFixabilityMarkdown(data, existing);
          } else {
            const data = {
              name: form.get('name') || '',
              categoryId: await resolveLocalCategoryId('materials', { categoryId: form.get('categoryId') }),
              durability: form.get('durability') || 'medium',
              recyclability: form.get('recyclability') || 'medium',
              bestFor: form.get('bestFor') || '',
              summary: form.get('summary') || ''
            };
            slug = slugInput || slugify(data.name);
            markdown = buildMaterialsMarkdown(data, existing);
          }

          const dir = path.join(ROOT, 'src', 'content', collection, 'en');
          await writeFile(path.join(dir, `${slug}.md`), markdown);
          await runTranslate();

          res.writeHead(303, { Location: `/?flash=${encodeURIComponent('Saved.')}` });
          res.end();
          return;
        }

        const deleteMatch = url.pathname.match(new RegExp(`^/${collection}/delete/(.+)$`));
        if (req.method === 'POST' && deleteMatch) {
          const slug = decodeURIComponent(deleteMatch[1]);
          await deleteAcrossLocales(collection, slug);
          res.writeHead(303, { Location: `/?flash=${encodeURIComponent('Deleted.')}` });
          res.end();
          return;
        }
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error: ${err.message}`);
    }
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Data editor running at http://127.0.0.1:${PORT}`);
  });
}

main();

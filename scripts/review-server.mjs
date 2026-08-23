// Local-only guide review tool (browser version). Run: npm run review:web
// then open http://127.0.0.1:5679
//
// Binds to 127.0.0.1 only - not reachable from your network, let alone the
// internet. No login screen because nothing outside your own machine can
// reach it. This is intentionally NOT part of the deployed site.
//
// Every field is a real, editable form field, pre-filled from the
// submission when one exists (or blank, with the raw issue text shown for
// reference, when it doesn't - e.g. issues filed before this tool existed).
// Approving always publishes whatever is currently in the form, not
// necessarily the original submission verbatim, so light corrections don't
// need a separate edit step.
//
// Styling reuses the real site's own compiled Tailwind output (from the
// latest `npm run build`) so this looks like the actual guide page, not an
// approximation of it - only the classes already used somewhere in src/
// are available here, since that's what Tailwind's scanner picked up.

import http from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ROOT,
  loadDevVars,
  parseSubmissionData,
  parseLegacyBody,
  listPendingIssues,
  getIssue,
  getDefaultBranch,
  approveSubmission,
  rejectSubmission
} from './review-lib.mjs';

const PORT = 5679;

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

// Small amount of admin-only chrome that has no equivalent anywhere on the
// real site (so isn't in the compiled CSS above): the header bar, status
// badges, flash banner, and the reject button's color.
const ADMIN_CSS = `
  body { background: #fafaf9; }
  .admin-header { background: white; border-bottom: 1px solid #e7e5e4; padding: 1rem 1.5rem; }
  .admin-header a { color: #047857; font-weight: 700; text-decoration: none; }
  .badge { display: inline-block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;
    padding: 0.15rem 0.5rem; border-radius: 999px; }
  .badge.pending { background: #d1fae5; color: #065f46; }
  .badge.nodata { background: #fef3c7; color: #92400e; }
  .flash { background: #d1fae5; border: 1px solid #6ee7b7; color: #065f46; padding: 0.75rem 1rem; border-radius: 8px; margin: 0 auto 1.5rem; max-width: 48rem; }
  .btn-danger { background: white; color: #dc2626; border: 1px solid #fecaca; font-weight: 600; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }
  .btn-danger:hover { background: #fef2f2; }
  .field-label { display: block; font-size: 0.875rem; font-weight: 600; color: #44403c; margin-bottom: 0.25rem; }
`;

function page(title, body, flash, siteCss) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)} · Guide Review</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${siteCss ? `<style>${siteCss}</style>` : '<!-- no compiled site CSS found - run "npm run build" first -->'}
<style>${ADMIN_CSS}</style>
</head>
<body class="min-h-screen text-stone-900">
<header class="admin-header"><a href="/">Guide Review</a></header>
<main>
${flash ? `<div class="flash">${escapeHtml(flash)}</div>` : ''}
${body}
</main>
</body>
</html>`;
}

async function listHtml({ repo, token }) {
  const issues = await listPendingIssues(repo, token);
  if (issues.length === 0) return '<p class="max-w-3xl mx-auto px-4 py-12 text-stone-500 text-center">No pending submissions.</p>';
  return `<div class="max-w-3xl mx-auto px-4 py-12">${issues
    .map((issue) => {
      const submission = parseSubmissionData(issue.body);
      return `<div class="border border-stone-200 rounded-lg p-5 mb-4">
        <span class="badge ${submission ? 'pending' : 'nodata'}">${submission ? 'pending review' : 'no structured data'}</span>
        <h3 class="mt-1 font-semibold text-stone-900">${escapeHtml(issue.title)}</h3>
        <p class="mt-2 text-sm text-stone-500">#${issue.number} &middot; opened ${new Date(issue.created_at).toLocaleDateString()}</p>
        <a class="inline-block mt-3 bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-800 transition text-sm" href="/issue/${issue.number}">Review</a>
      </div>`;
    })
    .join('\n')}</div>`;
}

function field(label, name, value, opts = {}) {
  const { placeholder = '', type = 'text', wrapperClass = '' } = opts;
  return `<label class="block ${wrapperClass}">
    <span class="field-label">${escapeHtml(label)}</span>
    <input type="${type}" name="${name}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" class="mt-1 w-full border border-stone-300 rounded-md px-3 py-2" />
  </label>`;
}

function textareaField(label, name, value, opts = {}) {
  const { placeholder = '', rows = 2, wrapperClass = '' } = opts;
  return `<label class="block ${wrapperClass}">
    <span class="field-label">${escapeHtml(label)}</span>
    <textarea name="${name}" rows="${rows}" placeholder="${escapeHtml(placeholder)}" class="mt-1 w-full border border-stone-300 rounded-md px-3 py-2">${escapeHtml(value)}</textarea>
  </label>`;
}

function stepRowHtml(step, imagePath, imgSrc) {
  return `<div class="step-row border border-stone-200 rounded-lg p-4 space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold text-stone-500 step-number"></span>
      <button type="button" class="remove-step text-xs text-red-600 hover:underline">Remove</button>
    </div>
    <textarea name="step_text" rows="2" class="step-text w-full border border-stone-300 rounded-md px-3 py-2 text-sm" placeholder="What do you do in this step?">${escapeHtml(step?.text || '')}</textarea>
    ${imgSrc ? `<img src="${imgSrc}" alt="" class="rounded-lg border border-stone-200 max-w-xs">` : ''}
    <input type="hidden" name="step_image" value="${escapeHtml(imagePath || '')}">
    <div class="grid gap-2 sm:grid-cols-2">
      <input name="step_part" value="${escapeHtml(step?.partLink || '')}" class="border border-stone-300 rounded-md px-2 py-1.5 text-sm" placeholder="Part link: Label | URL (optional)" />
      <input name="step_video" value="${escapeHtml(step?.videoLink || '')}" class="border border-stone-300 rounded-md px-2 py-1.5 text-sm" placeholder="Video link: Label | URL (optional)" />
    </div>
  </div>`;
}

const STEP_LIST_SCRIPT = `
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
    const node = stepTemplate.content.cloneNode(true);
    stepsList.appendChild(node);
    wireRemove(stepsList.lastElementChild);
    renumberSteps();
  });
`;

async function issueHtml({ repo, token, number }) {
  const issue = await getIssue(repo, token, number);
  const submission = parseSubmissionData(issue.body);
  const legacy = !submission ? parseLegacyBody(issue.body) : null;

  const data = submission?.data || (legacy ? { ...legacy, title: issue.title.replace(/^\[Guide\]\s*/, '') } : {});
  const steps = submission?.steps || legacy?.steps || [];
  const imagePaths = submission?.imagePaths || { cover: null, steps: [] };

  let rawUrl = () => null;
  if (imagePaths.cover || imagePaths.steps.some(Boolean)) {
    const branch = await getDefaultBranch(repo, token);
    rawUrl = (p) => (p ? `https://raw.githubusercontent.com/${repo}/${branch}/${p}` : null);
  }

  const referenceBox = !submission
    ? `<div class="mt-6 p-4 bg-stone-100 rounded-lg">
        <h2 class="font-semibold text-sm mb-2">Original submission (no structured data - predates this tool)</h2>
        <p class="text-xs text-stone-500 mb-2">Fields below are pre-filled by best-effort parsing of this text - double check them.</p>
        <pre class="text-sm text-stone-700 whitespace-pre-wrap">${escapeHtml(issue.body)}</pre>
      </div>`
    : '';

  const stepsHtml = (steps.length > 0 ? steps : [null])
    .map((step, i) => stepRowHtml(step, imagePaths.steps?.[i], rawUrl(imagePaths.steps?.[i])))
    .join('\n');

  const cover = rawUrl(imagePaths.cover);

  return `<article class="max-w-3xl mx-auto px-4 py-12">
    <a href="/" class="text-sm text-stone-500 hover:text-emerald-700">&larr; All submissions</a>

    ${referenceBox}

    <form method="POST" action="/issue/${number}/approve" class="mt-6 space-y-6">
      <div class="grid gap-4 sm:grid-cols-2">
        ${field('Guide title', 'title', data.title, { wrapperClass: 'sm:col-span-2' })}
        ${field('Product / product type', 'productName', data.productName)}
        ${field('Category', 'category', data.category)}
        <label class="block">
          <span class="field-label">Difficulty</span>
          <select name="difficulty" class="mt-1 w-full border border-stone-300 rounded-md px-3 py-2 bg-white">
            ${['beginner', 'intermediate', 'advanced'].map((d) => `<option value="${d}" ${data.difficulty === d ? 'selected' : ''}>${d[0].toUpperCase()}${d.slice(1)}</option>`).join('')}
          </select>
        </label>
        ${field('Estimated time', 'estimatedTime', data.estimatedTime)}
      </div>

      ${textareaField('Tools needed', 'tools', data.tools, { placeholder: 'One per line' })}

      ${cover ? `<div><span class="field-label">Cover photo</span><img src="${cover}" alt="Cover" class="mt-1 max-w-xs rounded-lg border border-stone-200"></div>` : ''}
      <input type="hidden" name="coverImagePath" value="${escapeHtml(imagePaths.cover || '')}">

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

      ${textareaField('Notes', 'notes', data.notes, { rows: 3 })}
      ${field('Submitted by', 'authorName', data.authorName)}

      <button type="submit" class="bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-emerald-800 transition">
        Approve &amp; publish
      </button>
    </form>

    <form method="POST" action="/issue/${number}/reject" class="mt-4">
      <textarea name="reason" rows="2" class="w-full border border-stone-300 rounded-md px-3 py-2 text-sm" placeholder="Rejection reason (optional, shown to submitter)"></textarea>
      <button type="submit" class="btn-danger mt-2">Reject</button>
    </form>
  </article>

  <template id="step-template">${stepRowHtml(null, null, null)}</template>
  <script>${STEP_LIST_SCRIPT}</script>`;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return new URLSearchParams(Buffer.concat(chunks).toString());
}

function submissionFromForm(form) {
  const data = {
    title: form.get('title') || '',
    productName: form.get('productName') || '',
    category: form.get('category') || '',
    difficulty: form.get('difficulty') || 'beginner',
    estimatedTime: form.get('estimatedTime') || '',
    tools: form.get('tools') || '',
    partLinks: form.get('partLinks') || '',
    videoLinks: form.get('videoLinks') || '',
    notes: form.get('notes') || '',
    authorName: form.get('authorName') || ''
  };
  const texts = form.getAll('step_text');
  const parts = form.getAll('step_part');
  const videos = form.getAll('step_video');
  const images = form.getAll('step_image');
  const rows = texts.map((text, i) => ({ text, partLink: parts[i] || '', videoLink: videos[i] || '', image: images[i] || '' }));
  const kept = rows.filter((r) => r.text.trim());
  const steps = kept.map(({ text, partLink, videoLink }) => ({ text, partLink, videoLink }));
  const imagePaths = { cover: form.get('coverImagePath') || null, steps: kept.map((r) => r.image || null) };
  return { data, steps, imagePaths };
}

async function main() {
  const { token, repo } = await loadDevVars();

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    try {
      if (req.method === 'GET' && url.pathname === '/') {
        const flash = url.searchParams.get('flash');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(page('Pending submissions', await listHtml({ repo, token }), flash, await loadSiteCss()));
        return;
      }

      const issueMatch = url.pathname.match(/^\/issue\/(\d+)$/);
      if (req.method === 'GET' && issueMatch) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(page(`Issue #${issueMatch[1]}`, await issueHtml({ repo, token, number: issueMatch[1] }), null, await loadSiteCss()));
        return;
      }

      const approveMatch = url.pathname.match(/^\/issue\/(\d+)\/approve$/);
      if (req.method === 'POST' && approveMatch) {
        const number = approveMatch[1];
        const form = await readBody(req);
        const issue = await getIssue(repo, token, number);
        const submission = submissionFromForm(form);
        const { slug } = await approveSubmission({ repo, token, issue, submission });
        res.writeHead(303, { Location: `/?flash=${encodeURIComponent(`Approved as ${slug}. Run "npm run build" to see it live locally.`)}` });
        res.end();
        return;
      }

      const rejectMatch = url.pathname.match(/^\/issue\/(\d+)\/reject$/);
      if (req.method === 'POST' && rejectMatch) {
        const number = rejectMatch[1];
        const form = await readBody(req);
        const issue = await getIssue(repo, token, number);
        await rejectSubmission({ repo, token, issue, reason: form.get('reason') });
        res.writeHead(303, { Location: `/?flash=${encodeURIComponent(`Rejected #${number}.`)}` });
        res.end();
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error: ${err.message}`);
    }
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Review tool running at http://127.0.0.1:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

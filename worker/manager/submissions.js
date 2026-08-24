import { listPendingIssues, getIssue, commentOnIssue, closeIssue, getDefaultBranch, getFileBinary, putFileBinary, putFile, deleteFile } from '../lib/github.js';
import { parseSubmissionData, parseLegacyBody, slugify, buildGuideMarkdown } from '../lib/content-format.js';
import { escapeHtml, page, field, textareaField, readFormBody } from '../lib/html.js';
import { translateEntry, TARGET_LOCALES } from '../lib/translate.js';

const GUIDE_FIELDS = ['title', 'productName', 'category', 'estimatedTime', 'tools', 'partLinks', 'videoLinks', 'notes'];

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
    const node = stepTemplate.content.cloneNode(true);
    stepsList.appendChild(node);
    wireRemove(stepsList.lastElementChild);
    renumberSteps();
  });
`;

async function listHtml(repo, token) {
  const issues = await listPendingIssues(repo, token);
  if (issues.length === 0) return '<p class="max-w-3xl mx-auto px-4 py-12 text-stone-500 text-center">No pending submissions.</p>';
  return `<div class="max-w-3xl mx-auto px-4 py-12">${issues
    .map((issue) => {
      const submission = parseSubmissionData(issue.body);
      return `<div class="border border-stone-200 rounded-lg p-5 mb-4">
        <span class="badge ${submission ? 'pending' : 'nodata'}">${submission ? 'pending review' : 'no structured data'}</span>
        <h3 class="mt-1 font-semibold text-stone-900">${escapeHtml(issue.title)}</h3>
        <p class="mt-2 text-sm text-stone-500">#${issue.number} &middot; opened ${new Date(issue.created_at).toLocaleDateString()}</p>
        <a class="inline-block mt-3 bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-800 transition text-sm" href="/manager/submissions/${issue.number}">Review</a>
      </div>`;
    })
    .join('\n')}</div>`;
}

async function issueHtml(repo, token, number) {
  const issue = await getIssue(repo, token, number);
  const submission = parseSubmissionData(issue.body);
  const data = submission?.data || {};
  const steps = submission?.steps || [];
  const imagePaths = submission?.imagePaths || { cover: null, steps: [] };

  let rawUrl = () => null;
  if (imagePaths.cover || imagePaths.steps.some(Boolean)) {
    const branch = await getDefaultBranch(repo, token);
    rawUrl = (p) => (p ? `https://raw.githubusercontent.com/${repo}/${branch}/${p}` : null);
  }

  const referenceBox = !submission
    ? `<div class="mt-6 p-4 bg-stone-100 rounded-lg">
        <h2 class="font-semibold text-sm mb-2">Original submission (no structured data - predates this format)</h2>
        <pre class="text-sm text-stone-700 whitespace-pre-wrap">${escapeHtml(issue.body)}</pre>
      </div>`
    : '';

  const stepsHtml = (steps.length > 0 ? steps : [null]).map((step, i) => stepRowHtml(step, imagePaths.steps?.[i], rawUrl(imagePaths.steps?.[i]))).join('\n');
  const cover = rawUrl(imagePaths.cover);

  return `<article class="max-w-3xl mx-auto px-4 py-12">
    <a href="/manager" class="text-sm text-stone-500 hover:text-emerald-700">&larr; All submissions</a>
    ${referenceBox}
    <form method="POST" action="/manager/submissions/${number}/approve" class="mt-6 space-y-6">
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
      <button type="submit" class="bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-emerald-800 transition">Approve &amp; publish</button>
    </form>
    <form method="POST" action="/manager/submissions/${number}/reject" class="mt-4">
      <textarea name="reason" rows="2" class="w-full border border-stone-300 rounded-md px-3 py-2 text-sm" placeholder="Rejection reason (optional, shown to submitter)"></textarea>
      <button type="submit" class="btn-danger mt-2">Reject</button>
    </form>
  </article>
  <template id="step-template">${stepRowHtml(null, null, null)}</template>
  <script>${STEP_SCRIPT}</script>`;
}

function submissionFromForm(form) {
  const data = Object.fromEntries(GUIDE_FIELDS.map((f) => [f, form.get(f) || '']));
  data.difficulty = form.get('difficulty') || 'beginner';
  data.authorName = form.get('authorName') || '';
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

async function moveStagedImage(repo, token, remotePath, destPath) {
  const { bytes, sha } = await getFileBinary(repo, token, remotePath);
  await putFileBinary(repo, token, destPath, bytes, `Publish image: ${destPath}`);
  await deleteFile(repo, token, remotePath, sha, `Clean up staged image: ${remotePath}`);
}

async function translateAndPublish({ repo, token, env, slug, guideMarkdownData, steps }) {
  for (const locale of TARGET_LOCALES) {
    const translatedData = await translateEntry({
      data: guideMarkdownData,
      fields: ['title', 'productName', 'category', 'estimatedTime', 'tools', 'partLinks', 'videoLinks', 'notes'],
      env,
      targetLocale: locale
    });
    const translatedSteps = await Promise.all(
      steps.map(async (step) => ({
        text: await translateEntry({ data: { text: step.text }, fields: ['text'], env, targetLocale: locale }).then((d) => d.text),
        partLink: step.partLink,
        videoLink: step.videoLink
      }))
    );
    const markdown = buildGuideMarkdown({
      data: translatedData,
      steps: translatedSteps,
      localImagePaths: { cover: guideMarkdownData.__coverPath || null, steps: guideMarkdownData.__stepImagePaths || [] },
      publishDate: guideMarkdownData.__publishDate,
      translationStatus: 'machine'
    });
    await putFile(repo, token, `src/content/guides/${locale}/${slug}.md`, markdown, `Add ${locale} draft for ${slug}`);
  }
}

export const routes = {
  async list({ repo, token, url }) {
    return page({ title: 'Pending submissions', body: await listHtml(repo, token), flash: url.searchParams.get('flash'),  activeTab: 'submissions' });
  },
  async detail({ repo, token, number }) {
    return page({ title: `Issue #${number}`, body: await issueHtml(repo, token, number), flash: null,  activeTab: 'submissions' });
  },
  async approve({ repo, token, env, request, number }) {
    const form = await readFormBody(request);
    const issue = await getIssue(repo, token, number);
    const { data, steps, imagePaths } = submissionFromForm(form);

    let slug = slugify(data.title);
    const existing = await getFileBinary(repo, token, `src/content/guides/en/${slug}.md`).catch(() => null);
    if (existing) slug = `${slug}-${number}`;

    const localImagePaths = { cover: null, steps: [] };
    if (imagePaths.cover) {
      const filename = imagePaths.cover.split('/').pop();
      localImagePaths.cover = `/guides/${slug}/${filename}`;
      await moveStagedImage(repo, token, imagePaths.cover, `public/guides/${slug}/${filename}`);
    }
    for (let i = 0; i < imagePaths.steps.length; i++) {
      const p = imagePaths.steps[i];
      if (!p) continue;
      const filename = p.split('/').pop();
      localImagePaths.steps[i] = `/guides/${slug}/${filename}`;
      await moveStagedImage(repo, token, p, `public/guides/${slug}/${filename}`);
    }

    const publishDate = new Date().toISOString().slice(0, 10);
    const markdown = buildGuideMarkdown({ data, steps, localImagePaths, publishDate });
    await putFile(repo, token, `src/content/guides/en/${slug}.md`, markdown, `Approve guide submission #${number}: ${slug}`);

    await translateAndPublish({
      repo,
      token,
      env,
      slug,
      guideMarkdownData: { ...data, __coverPath: localImagePaths.cover, __stepImagePaths: localImagePaths.steps, __publishDate: publishDate },
      steps
    });

    await commentOnIssue(repo, token, number, `Approved - added as \`src/content/guides/en/${slug}.md\`.`);
    await closeIssue(repo, token, number, 'completed');

    return { redirect: `/manager?flash=${encodeURIComponent(`Approved as ${slug}. Live in a minute or two once the site rebuilds.`)}` };
  },
  async reject({ repo, token, request, number }) {
    const form = await readFormBody(request);
    const reason = form.get('reason');
    await commentOnIssue(repo, token, number, reason?.trim() ? `Not approved: ${reason.trim()}` : 'Not approved.');
    await closeIssue(repo, token, number, 'not_planned');
    return { redirect: `/manager?flash=${encodeURIComponent(`Rejected #${number}.`)}` };
  }
};

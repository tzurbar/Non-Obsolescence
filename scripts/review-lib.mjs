// Shared logic between the CLI (review.mjs) and the local web UI
// (review-server.mjs). Never exposed publicly - both entry points only
// bind to your own machine.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

export const ROOT = process.cwd();

export async function loadDevVars() {
  const file = path.join(ROOT, '.dev.vars');
  if (!existsSync(file)) {
    throw new Error('Missing .dev.vars. Copy .dev.vars.example to .dev.vars and add your GITHUB_TOKEN first.');
  }
  const vars = {};
  for (const line of (await readFile(file, 'utf-8')).split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) vars[match[1]] = match[2].trim();
  }
  if (!vars.GITHUB_TOKEN) {
    throw new Error('.dev.vars has no GITHUB_TOKEN set.');
  }
  return { token: vars.GITHUB_TOKEN, repo: vars.GITHUB_REPO || 'tzurbar/Non-Obsolescence' };
}

export function ghFetch(repo, token, urlPath, opts = {}) {
  return fetch(`https://api.github.com/repos/${repo}${urlPath}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'non-obsolescence-review-tool',
      'Content-Type': 'application/json',
      ...opts.headers
    }
  });
}

export function parseSubmissionData(body) {
  const match = (body || '').match(/<!-- SUBMISSION_DATA\n([\s\S]*?)\n-->/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

// Best-effort extraction for issues filed before SUBMISSION_DATA existed -
// their body is still the same prose format the Function used to write
// (**Label:** value, with **Tools:**/**Steps:**/**Notes:** blocks), just
// without the machine-readable copy. Good enough to pre-fill the form so a
// human isn't retyping everything by hand; they can still fix anything a
// loose test string ("Tools: player") throws off.
export function parseLegacyBody(body) {
  const line = (label) => {
    const m = body.match(new RegExp(`\\*\\*${label}:\\*\\*[ \\t]*(.*)`));
    return m ? m[1].trim() : '';
  };

  const section = (label, nextLabels) => {
    const startMarker = `**${label}:**`;
    const start = body.indexOf(startMarker);
    if (start === -1) return '';
    const afterHeader = body.indexOf('\n', start) + 1 || body.length;
    let end = body.length;
    for (const next of [...nextLabels, '']) {
      const marker = next ? `**${next}:**` : '<!-- SUBMISSION_DATA';
      const idx = body.indexOf(marker, afterHeader);
      if (idx !== -1 && idx < end) end = idx;
    }
    return body.slice(afterHeader, end).trim();
  };

  const difficultyRaw = line('Difficulty').toLowerCase();
  const difficulty = ['beginner', 'intermediate', 'advanced'].includes(difficultyRaw) ? difficultyRaw : 'beginner';

  const stepsBlock = section('Steps', ['Part links', 'Video links', 'Notes']);
  const steps = [...stepsBlock.matchAll(/^\d+\.\s+(.+)$/gm)].map((m) => ({
    text: m[1].trim(),
    partLink: '',
    videoLink: ''
  }));

  return {
    productName: line('Product'),
    categorySuggestion: line('Category'),
    difficulty,
    estimatedTime: line('Estimated time'),
    authorName: line('Submitted by'),
    tools: section('Tools', ['Steps']),
    partLinks: section('Part links', ['Video links', 'Notes', 'Submitted by']),
    videoLinks: section('Video links', ['Notes', 'Submitted by']),
    notes: section('Notes', ['Submitted by']),
    steps
  };
}

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function parseLinkLine(line) {
  const [label, url] = line.split('|').map((s) => s.trim());
  return { label: label || url, url: url || label };
}

export function parseLinkBlock(text) {
  return (text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => l.includes('|') || /^https?:\/\//.test(l))
    .map(parseLinkLine);
}

export async function fetchStagedFile(repo, token, filePath) {
  const res = await ghFetch(repo, token, `/contents/${filePath}`);
  if (!res.ok) throw new Error(`Could not fetch staged file ${filePath} (${res.status})`);
  const json = await res.json();
  return { buffer: Buffer.from(json.content, 'base64'), sha: json.sha };
}

export async function deleteRemoteFile(repo, token, filePath, sha, message) {
  await ghFetch(repo, token, `/contents/${filePath}`, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha })
  });
}

export function yamlString(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

const CATEGORY_DOMAIN_FOLDERS = { guides: 'categories-guides', fixability: 'categories-fixability', materials: 'categories-materials' };

// Minimal local-tool equivalent of the manager's category picker: if a real
// categoryId was already provided (typed into the web tool), trust it.
// Otherwise fall back to whatever free-text category label is available
// (e.g. the submitter's suggestion) and auto-create it as a top-level
// category if nothing matches yet. No parent selection here - for real
// tree management, use the web manager (/manager/data/categories), which
// this is a fallback for, not a replacement of.
export async function resolveLocalCategoryId(domain, { categoryId, categoryLabel }) {
  if (categoryId?.trim()) return categoryId.trim();
  const label = (categoryLabel || '').trim();
  if (!label) return '';
  const folder = CATEGORY_DOMAIN_FOLDERS[domain];
  const dir = path.join(ROOT, 'src', 'content', folder, 'en');
  await mkdir(dir, { recursive: true });
  const slug = slugify(label);
  const filePath = path.join(dir, `${slug}.md`);
  if (!existsSync(filePath)) {
    await writeFile(filePath, `---\nlabel: ${yamlString(label)}\n---\n`);
  }
  return slug;
}

export function buildGuideMarkdown({ data, steps, localImagePaths, publishDate }) {
  const lines = ['---'];
  lines.push(`title: ${yamlString(data.title)}`);
  lines.push(`productName: ${yamlString(data.productName)}`);
  lines.push(`categoryId: ${yamlString(data.categoryId)}`);
  lines.push(`difficulty: ${data.difficulty}`);
  lines.push(`estimatedTime: ${yamlString(data.estimatedTime)}`);

  const tools = (data.tools || '').split('\n').map((t) => t.trim()).filter(Boolean);
  if (tools.length > 0) {
    lines.push('tools:');
    tools.forEach((t) => lines.push(`  - ${yamlString(t)}`));
  } else {
    lines.push('tools: []');
  }

  if (localImagePaths.cover) lines.push(`coverImage: ${localImagePaths.cover}`);
  lines.push(`featured: false`);
  if (data.authorName?.trim()) lines.push(`authorName: ${yamlString(data.authorName)}`);
  lines.push(`publishDate: ${publishDate}`);

  const partLinks = parseLinkBlock(data.partLinks);
  const videoLinks = parseLinkBlock(data.videoLinks);
  if (partLinks.length > 0) {
    lines.push('partLinks:');
    partLinks.forEach((l) => lines.push(`  - label: ${yamlString(l.label)}\n    url: ${yamlString(l.url)}`));
  }
  if (videoLinks.length > 0) {
    lines.push('videoLinks:');
    videoLinks.forEach((l) => lines.push(`  - label: ${yamlString(l.label)}\n    url: ${yamlString(l.url)}`));
  }

  lines.push('steps:');
  steps.filter((step) => step?.text?.trim()).forEach((step, i) => {
    lines.push(`  - text: ${yamlString(step.text)}`);
    if (localImagePaths.steps[i]) lines.push(`    image: ${localImagePaths.steps[i]}`);
    if (step.partLink?.trim()) {
      const l = parseLinkLine(step.partLink);
      lines.push(`    partLinks:\n      - label: ${yamlString(l.label)}\n        url: ${yamlString(l.url)}`);
    }
    if (step.videoLink?.trim()) {
      const l = parseLinkLine(step.videoLink);
      lines.push(`    videoLinks:\n      - label: ${yamlString(l.label)}\n        url: ${yamlString(l.url)}`);
    }
  });

  lines.push('---');
  if (data.notes?.trim()) {
    lines.push('');
    lines.push('## Notes');
    lines.push('');
    lines.push(data.notes.trim());
  }
  return lines.join('\n') + '\n';
}

// Runs the same script `npm run translate` uses, right after a guide is
// approved - so machine-translated drafts exist immediately instead of
// depending on someone remembering to run it later. Failures here don't
// block the approval itself (the guide is already published in English);
// they're just logged for whoever's watching the review tool's output.
export function runTranslate() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(ROOT, 'scripts', 'translate.mjs')], {
      cwd: ROOT,
      stdio: 'pipe'
    });
    let output = '';
    child.stdout.on('data', (d) => (output += d));
    child.stderr.on('data', (d) => (output += d));
    child.on('close', (code) => {
      if (code !== 0) console.warn(`[translate] exited with code ${code}:\n${output}`);
      resolve();
    });
    child.on('error', (err) => {
      console.warn(`[translate] failed to start: ${err.message}`);
      resolve();
    });
  });
}

export async function getDefaultBranch(repo, token) {
  const res = await ghFetch(repo, token, '');
  if (!res.ok) throw new Error(`Failed to load repo info (${res.status})`);
  const info = await res.json();
  return info.default_branch || 'main';
}

export async function listPendingIssues(repo, token) {
  const res = await fetch(`https://api.github.com/repos/${repo}/issues?labels=guide-submission&state=open`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'non-obsolescence-review-tool' }
  });
  if (!res.ok) throw new Error(`Failed to list issues (${res.status}): ${await res.text()}`);
  return res.json();
}

export async function getIssue(repo, token, number) {
  const res = await ghFetch(repo, token, `/issues/${number}`);
  if (!res.ok) throw new Error(`Failed to load issue #${number} (${res.status})`);
  return res.json();
}

export async function approveSubmission({ repo, token, issue, submission }) {
  const { data, steps, imagePaths } = submission;
  data.categoryId = await resolveLocalCategoryId('guides', {
    categoryId: data.categoryId,
    categoryLabel: data.category || data.categorySuggestion
  });
  let slug = slugify(data.title);
  const filePath = path.join(ROOT, 'src', 'content', 'guides', 'en', `${slug}.md`);
  if (existsSync(filePath)) slug = `${slug}-${issue.number}`;

  const localImagePaths = { cover: null, steps: [] };
  const staged = [];
  if (imagePaths?.cover) staged.push(['cover', imagePaths.cover]);
  (imagePaths?.steps || []).forEach((p, i) => {
    if (p) staged.push([`step-${i}`, p]);
  });

  if (staged.length > 0) {
    await mkdir(path.join(ROOT, 'public', 'guides', slug), { recursive: true });
    for (const [key, remotePath] of staged) {
      const { buffer, sha } = await fetchStagedFile(repo, token, remotePath);
      const filename = path.basename(remotePath);
      const localPath = `/guides/${slug}/${filename}`;
      await writeFile(path.join(ROOT, 'public', 'guides', slug, filename), buffer);
      if (key === 'cover') localImagePaths.cover = localPath;
      else localImagePaths.steps[Number(key.split('-')[1])] = localPath;
      await deleteRemoteFile(repo, token, remotePath, sha, `Clean up staged image after approving #${issue.number}`);
    }
  }

  const publishDate = new Date().toISOString().slice(0, 10);
  const markdown = buildGuideMarkdown({ data, steps, localImagePaths, publishDate });
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, markdown);

  await ghFetch(repo, token, `/issues/${issue.number}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body: `Approved - added as \`src/content/guides/en/${slug}.md\`.` })
  });
  await ghFetch(repo, token, `/issues/${issue.number}`, {
    method: 'PATCH',
    body: JSON.stringify({ state: 'closed', state_reason: 'completed' })
  });

  await runTranslate();

  return { slug };
}

export async function rejectSubmission({ repo, token, issue, reason }) {
  await ghFetch(repo, token, `/issues/${issue.number}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body: reason?.trim() ? `Not approved: ${reason.trim()}` : 'Not approved.' })
  });
  await ghFetch(repo, token, `/issues/${issue.number}`, {
    method: 'PATCH',
    body: JSON.stringify({ state: 'closed', state_reason: 'not_planned' })
  });
}

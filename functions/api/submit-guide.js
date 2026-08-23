// Cloudflare Pages Function: POST /api/submit-guide
// Receives the on-site submission form (multipart, may include photos) and:
//   1. commits any uploaded images into the repo under submissions/pending/<id>/
//      (outside public/, so nothing goes live until a maintainer moves it)
//   2. files a GitHub issue (tagged guide-submission/pending-review) referencing
//      those staged files, using a bot token - visitors never need GitHub.
//
// Requires a GITHUB_TOKEN secret in the Cloudflare Pages project
// (Settings -> Environment variables): a fine-grained PAT scoped to this repo
// only, with "Contents: write" and "Issues: write".

const MAX_FIELD_LENGTH = 5000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const REQUIRED_FIELDS = ['title', 'productName', 'category', 'difficulty', 'estimatedTime'];

export function validateSubmission(body, steps) {
  const errors = [];
  if (typeof body !== 'object' || body === null) return ['Invalid submission.'];
  if (body.website) errors.push('Spam detected.'); // honeypot field, left empty by real users

  for (const field of REQUIRED_FIELDS) {
    if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  if (!Array.isArray(steps) || steps.filter((s) => s?.text?.trim()).length === 0) {
    errors.push('At least one step is required.');
  }
  for (const [key, val] of Object.entries(body)) {
    if (typeof val === 'string' && val.length > MAX_FIELD_LENGTH) {
      errors.push(`Field "${key}" is too long.`);
    }
  }
  return errors;
}

export function validateImage(file) {
  if (!file || typeof file === 'string') return null; // no file provided, fine
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return `Unsupported image type: ${file.type || 'unknown'}`;
  if (file.size > MAX_IMAGE_BYTES) return `Image too large (max ${MAX_IMAGE_BYTES / 1024 / 1024}MB).`;
  return null;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function extensionFor(mimeType) {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[mimeType] || 'bin';
}

async function commitImage({ repo, token, submissionId, name, file }) {
  const content = arrayBufferToBase64(await file.arrayBuffer());
  const path = `submissions/pending/${submissionId}/${name}.${extensionFor(file.type)}`;
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'non-obsolescence-submit-form',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: `Add submission image: ${path}`, content })
  });
  if (!res.ok) throw new Error(`Failed to upload ${name} (${res.status}): ${await res.text()}`);
  return path;
}

export function buildIssueBody(data, steps, imagePaths) {
  const lines = [
    `**Product:** ${data.productName}`,
    `**Category:** ${data.category}`,
    `**Difficulty:** ${data.difficulty}`,
    `**Estimated time:** ${data.estimatedTime}`
  ];
  if (data.tools?.trim()) lines.push(`\n**Tools:**\n${data.tools}`);

  if (imagePaths.cover) lines.push(`\n**Cover image (staged):** \`${imagePaths.cover}\``);

  lines.push('\n**Steps:**');
  steps.forEach((step, i) => {
    lines.push(`\n${i + 1}. ${step.text}`);
    if (imagePaths.steps[i]) lines.push(`   - Image (staged): \`${imagePaths.steps[i]}\``);
    if (step.partLink?.trim()) lines.push(`   - Part: ${step.partLink}`);
    if (step.videoLink?.trim()) lines.push(`   - Video: ${step.videoLink}`);
  });

  if (data.partLinks?.trim()) lines.push(`\n**Part links:**\n${data.partLinks}`);
  if (data.videoLinks?.trim()) lines.push(`\n**Video links:**\n${data.videoLinks}`);
  if (data.notes?.trim()) lines.push(`\n**Notes:**\n${data.notes}`);
  if (data.authorName?.trim()) lines.push(`\n**Submitted by:** ${data.authorName}`);

  if (imagePaths.cover || imagePaths.steps.some(Boolean)) {
    lines.push(
      '\n---\n_Images above are staged in `submissions/pending/` and are not live until approved._'
    );
  }

  // Machine-readable copy for `npm run review` - invisible in GitHub's UI
  // (HTML comments don't render) but lets the review tool avoid re-parsing
  // the prose above.
  lines.push(`\n<!-- SUBMISSION_DATA\n${JSON.stringify({ data, steps, imagePaths })}\n-->`);

  return lines.join('\n');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost({ request, env }) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'Invalid form submission.' }, 400);
  }

  const body = {};
  for (const key of ['title', 'productName', 'category', 'difficulty', 'estimatedTime', 'tools', 'notes', 'authorName', 'website', 'partLinks', 'videoLinks']) {
    body[key] = form.get(key) ?? '';
  }

  let rawSteps;
  try {
    rawSteps = JSON.parse(String(form.get('stepsJson') || '[]'));
  } catch {
    return json({ ok: false, error: 'Invalid steps data.' }, 400);
  }

  // Drop empty (unfilled) step rows here, once, before anything else touches
  // step indices - image files are keyed by original row index, so filtering
  // steps and their files separately later would misalign image-to-step
  // pairing whenever a blank row sits before a step that has a photo.
  const keptIndices = rawSteps.map((_, i) => i).filter((i) => rawSteps[i]?.text?.trim());
  const steps = keptIndices.map((i) => rawSteps[i]);
  const stepFiles = keptIndices.map((i) => form.get(`stepImage_${i}`));

  const errors = validateSubmission(body, steps);
  const coverFile = form.get('coverImage');
  const coverError = validateImage(coverFile);
  if (coverError) errors.push(coverError);
  stepFiles.forEach((file, i) => {
    const err = validateImage(file);
    if (err) errors.push(`Step ${i + 1} image: ${err}`);
  });

  if (errors.length > 0) {
    return json({ ok: false, error: errors.join(' ') }, 400);
  }

  if (!env.GITHUB_TOKEN) {
    return json({ ok: false, error: 'Submissions are not configured yet (missing GITHUB_TOKEN).' }, 500);
  }

  const repo = env.GITHUB_REPO || 'tzurbar/Non-Obsolescence';
  const submissionId = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  try {
    const imagePaths = { cover: null, steps: [] };
    if (coverFile && typeof coverFile !== 'string') {
      imagePaths.cover = await commitImage({ repo, token: env.GITHUB_TOKEN, submissionId, name: 'cover', file: coverFile });
    }
    for (let i = 0; i < stepFiles.length; i++) {
      const file = stepFiles[i];
      imagePaths.steps[i] =
        file && typeof file !== 'string'
          ? await commitImage({ repo, token: env.GITHUB_TOKEN, submissionId, name: `step-${i + 1}`, file })
          : null;
    }

    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'non-obsolescence-submit-form',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `[Guide] ${body.title}`,
        body: buildIssueBody(body, steps, imagePaths),
        labels: ['guide-submission', 'pending-review']
      })
    });

    if (!res.ok) {
      return json({ ok: false, error: `GitHub rejected the submission (${res.status}).` }, 502);
    }

    const issue = await res.json();
    return json({ ok: true, issueUrl: issue.html_url });
  } catch (err) {
    return json({ ok: false, error: err.message || 'Upload failed.' }, 502);
  }
}

// GitHub API helpers for the manager tab. Workers have no filesystem and
// can't spawn processes, so everything here goes through GitHub's REST API
// directly - this is the Workers-runtime equivalent of scripts/review-lib.mjs,
// which does the same things but against a local git checkout.

export function ghFetch(repo, token, urlPath, opts = {}) {
  return fetch(`https://api.github.com/repos/${repo}${urlPath}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'non-obsolescence-manager',
      'Content-Type': 'application/json',
      ...opts.headers
    }
  });
}

function b64EncodeUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function b64DecodeUtf8(b64) {
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function getFile(repo, token, path) {
  const res = await ghFetch(repo, token, `/contents/${path}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to read ${path} (${res.status})`);
  const json = await res.json();
  return { content: b64DecodeUtf8(json.content), sha: json.sha };
}

export async function getFileBinary(repo, token, path) {
  const res = await ghFetch(repo, token, `/contents/${path}`);
  if (!res.ok) throw new Error(`Failed to read ${path} (${res.status})`);
  const json = await res.json();
  const binary = atob(json.content.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return { bytes, sha: json.sha };
}

export async function listDirectory(repo, token, path) {
  const res = await ghFetch(repo, token, `/contents/${path}`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Failed to list ${path} (${res.status})`);
  return res.json();
}

export async function putFile(repo, token, path, content, message, sha) {
  const res = await ghFetch(repo, token, `/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content: b64EncodeUtf8(content), ...(sha ? { sha } : {}) })
  });
  if (!res.ok) throw new Error(`Failed to write ${path} (${res.status}): ${await res.text()}`);
  return res.json();
}

function b64EncodeBytes(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function putFileBinary(repo, token, path, bytes, message, sha) {
  const res = await ghFetch(repo, token, `/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content: b64EncodeBytes(bytes), ...(sha ? { sha } : {}) })
  });
  if (!res.ok) throw new Error(`Failed to write ${path} (${res.status}): ${await res.text()}`);
  return res.json();
}

export async function deleteFile(repo, token, path, sha, message) {
  await ghFetch(repo, token, `/contents/${path}`, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha })
  });
}

export async function listPendingIssues(repo, token) {
  const res = await fetch(`https://api.github.com/repos/${repo}/issues?labels=guide-submission&state=open`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'non-obsolescence-manager' }
  });
  if (!res.ok) throw new Error(`Failed to list issues (${res.status}): ${await res.text()}`);
  return res.json();
}

export async function getIssue(repo, token, number) {
  const res = await ghFetch(repo, token, `/issues/${number}`);
  if (!res.ok) throw new Error(`Failed to load issue #${number} (${res.status})`);
  return res.json();
}

export async function commentOnIssue(repo, token, number, body) {
  await ghFetch(repo, token, `/issues/${number}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
}

export async function closeIssue(repo, token, number, stateReason) {
  await ghFetch(repo, token, `/issues/${number}`, {
    method: 'PATCH',
    body: JSON.stringify({ state: 'closed', state_reason: stateReason })
  });
}

export async function getDefaultBranch(repo, token) {
  const res = await ghFetch(repo, token, '');
  if (!res.ok) throw new Error(`Failed to load repo info (${res.status})`);
  const info = await res.json();
  return info.default_branch || 'main';
}

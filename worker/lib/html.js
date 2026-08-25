// Shared page shell for /manager pages.
//
// This intentionally does NOT try to reuse the real site's compiled
// Tailwind CSS the way the local review/data tools do (which read it
// straight off disk). Fetching it here would mean calling
// env.ASSETS.fetch() from inside this same Worker's own request handler -
// in `wrangler dev` that loops back through the same local dev server and
// can deadlock against the very request that's waiting on it (confirmed:
// hung indefinitely in testing). It's an unnecessary risk for an
// admin-only tool, so instead this ships a small self-contained utility
// stylesheet matching the site's real colors/spacing by hand.

export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const UTILITY_CSS = `
  * { box-sizing: border-box; }
  .block { display: block; }
  .inline-block { display: inline-block; }
  .flex { display: flex; }
  .grid { display: grid; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-2 { gap: 0.5rem; }
  .gap-4 { gap: 1rem; }
  .space-y-2 > * + * { margin-top: 0.5rem; }
  .space-y-4 > * + * { margin-top: 1rem; }
  .space-y-6 > * + * { margin-top: 1.5rem; }
  .max-w-2xl { max-width: 42rem; }
  .max-w-3xl { max-width: 48rem; }
  .max-w-xs { max-width: 20rem; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .min-h-screen { min-height: 100vh; }
  .w-full { width: 100%; }
  .mt-1 { margin-top: 0.25rem; } .mt-2 { margin-top: 0.5rem; } .mt-3 { margin-top: 0.75rem; }
  .mt-4 { margin-top: 1rem; } .mt-6 { margin-top: 1.5rem; } .mt-10 { margin-top: 2.5rem; }
  .mb-2 { margin-bottom: 0.5rem; } .mb-4 { margin-bottom: 1rem; } .mb-6 { margin-bottom: 1.5rem; }
  .p-4 { padding: 1rem; } .p-5 { padding: 1.25rem; }
  .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
  .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
  .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
  .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
  .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
  .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
  .border { border: 1px solid #e7e5e4; }
  .border-stone-200 { border-color: #e7e5e4; }
  .border-stone-300 { border-color: #d6d3d1; }
  .rounded-md { border-radius: 8px; }
  .rounded-lg { border-radius: 10px; }
  .text-center { text-align: center; }
  .text-2xl { font-size: 1.5rem; line-height: 2rem; }
  .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
  .text-sm { font-size: 0.875rem; }
  .text-xs { font-size: 0.75rem; }
  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
  .uppercase { text-transform: uppercase; }
  .tracking-wide { letter-spacing: 0.025em; }
  .whitespace-pre-wrap { white-space: pre-wrap; }
  .text-white { color: white; }
  .text-stone-500 { color: #78716c; }
  .text-stone-600 { color: #57534e; }
  .text-stone-700 { color: #44403c; }
  .text-stone-900 { color: #1c1917; }
  .text-emerald-700 { color: #047857; }
  .text-red-600 { color: #dc2626; }
  .bg-white { background: white; }
  .bg-stone-100 { background: #f5f5f4; }
  .bg-emerald-700 { background: #047857; }
  a.hover\\:text-emerald-700:hover, .hover\\:text-emerald-700:hover { color: #047857; }
  .hover\\:bg-emerald-800:hover { background: #065f46; }
  .hover\\:underline:hover { text-decoration: underline; }
  .transition { transition: all 0.15s ease; }
  select.bg-white { background: white; }
  input, textarea, select { font: inherit; color: inherit; }
  @media (min-width: 640px) { .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`;

const ADMIN_CSS = `
  body { background: #fafaf9; color: #1c1917; font-family: system-ui, -apple-system, sans-serif; }
  .admin-header { background: white; border-bottom: 1px solid #e7e5e4; padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; }
  .admin-header a.brand { color: #047857; font-weight: 700; text-decoration: none; }
  .admin-tabs { display: flex; gap: 1rem; font-size: 0.9rem; }
  .admin-tabs a { color: #57534e; text-decoration: none; padding: 0.25rem 0; border-bottom: 2px solid transparent; }
  .admin-tabs a.active { color: #047857; border-bottom-color: #047857; font-weight: 600; }
  .badge { display: inline-block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; padding: 0.15rem 0.5rem; border-radius: 999px; }
  .badge.pending { background: #d1fae5; color: #065f46; }
  .badge.nodata { background: #fef3c7; color: #92400e; }
  .flash { background: #d1fae5; border: 1px solid #6ee7b7; color: #065f46; padding: 0.75rem 1rem; border-radius: 8px; margin: 0 auto 1.5rem; max-width: 48rem; }
  .btn-danger { background: white; color: #dc2626; border: 1px solid #fecaca; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 8px; cursor: pointer; font-size: 0.8rem; }
  .btn-danger:hover { background: #fef2f2; }
  .field-label { display: block; font-size: 0.875rem; font-weight: 600; color: #44403c; margin-bottom: 0.25rem; }
  form.inline-delete { display: inline; }
  button[type="submit"] { cursor: pointer; border: none; }
  input[type="text"], input[type="number"], input:not([type]), textarea, select {
    border: 1px solid #d6d3d1; border-radius: 8px; padding: 0.5rem 0.75rem; width: 100%;
  }
`;

export function page({ title, body, flash, activeTab }) {
  const tabs = [
    { href: '/manager', label: 'Submissions', key: 'submissions' },
    { href: '/manager/data', label: 'Data', key: 'data' }
  ];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)} · Manager</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<style>${UTILITY_CSS}${ADMIN_CSS}</style>
</head>
<body class="min-h-screen text-stone-900">
<header class="admin-header">
  <a class="brand" href="/manager">Manager</a>
  <nav class="admin-tabs">
    ${tabs.map((t) => `<a href="${t.href}" class="${t.key === activeTab ? 'active' : ''}">${t.label}</a>`).join('')}
  </nav>
</header>
<main>
${flash ? `<div class="flash">${escapeHtml(flash)}</div>` : ''}
${body}
</main>
</body>
</html>`;
}

export function field(label, name, value, opts = {}) {
  const { placeholder = '', type = 'text', step, wrapperClass = '' } = opts;
  return `<label class="block ${wrapperClass}">
    <span class="field-label">${escapeHtml(label)}</span>
    <input type="${type}" ${step ? `step="${step}"` : ''} name="${name}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" class="mt-1" />
  </label>`;
}

export function textareaField(label, name, value, opts = {}) {
  const { placeholder = '', rows = 3, wrapperClass = '' } = opts;
  return `<label class="block ${wrapperClass}">
    <span class="field-label">${escapeHtml(label)}</span>
    <textarea name="${name}" rows="${rows}" placeholder="${escapeHtml(placeholder)}" class="mt-1">${escapeHtml(value)}</textarea>
  </label>`;
}

export function selectField(label, name, value, options) {
  return `<label class="block">
    <span class="field-label">${escapeHtml(label)}</span>
    <select name="${name}" class="mt-1">
      ${options.map((o) => `<option value="${o.value ?? o}" ${(o.value ?? o) === value ? 'selected' : ''}>${o.label ?? `${String(o)[0].toUpperCase()}${String(o).slice(1)}`}</option>`).join('')}
    </select>
  </label>`;
}

export function categoryPickerFields(nodes, currentId, suggestedNewLabel = '') {
  const indent = (depth) => '&nbsp;&nbsp;'.repeat(depth) + (depth > 0 ? '↳ ' : '');
  const options = nodes.map((n) => `<option value="${n.slug}" ${n.slug === currentId ? 'selected' : ''}>${indent(n.depth)}${escapeHtml(n.label)}</option>`).join('');
  const parentOptions = `<option value="">— top level —</option>` + nodes.map((n) => `<option value="${n.slug}">${indent(n.depth)}${escapeHtml(n.label)}</option>`).join('');
  // Only pre-fill the "new category" box with the submitter's suggestion if
  // it doesn't already match an existing category (otherwise the picker
  // above already covers it).
  const prefill = suggestedNewLabel && !nodes.some((n) => n.label.toLowerCase() === suggestedNewLabel.toLowerCase()) ? suggestedNewLabel : '';
  return `<div>
    <span class="field-label">Category</span>
    <select name="categoryId" class="mt-1">
      <option value="">— none —</option>
      ${options}
    </select>
  </div>
  <div class="mt-2">
    <span class="field-label" style="font-weight:400;color:#78716c">Or add a new category</span>
    <div class="grid gap-2 sm:grid-cols-2 mt-1">
      <input name="newCategoryLabel" value="${escapeHtml(prefill)}" placeholder="New category name" />
      <select name="newCategoryParentId">${parentOptions}</select>
    </div>
  </div>`;
}

export async function readFormBody(request) {
  return new URLSearchParams(await request.text());
}

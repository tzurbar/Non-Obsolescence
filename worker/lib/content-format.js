// Frontmatter/markdown builders - pure string logic, shared with the local
// tools' equivalents (scripts/review-lib.mjs, scripts/data-editor.mjs).
// Kept as a separate copy here because Workers bundle this file standalone;
// see CLAUDE.md note about keeping the two in sync if the schema changes.

export function yamlString(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
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

export function parseSubmissionData(body) {
  const match = (body || '').match(/<!-- SUBMISSION_DATA\n([\s\S]*?)\n-->/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

// Best-effort extraction for issues filed before SUBMISSION_DATA existed.
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
  const steps = [...stepsBlock.matchAll(/^\d+\.\s+(.+)$/gm)].map((m) => ({ text: m[1].trim(), partLink: '', videoLink: '' }));

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

export function buildGuideMarkdown({ data, steps, localImagePaths, publishDate, translationStatus }) {
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

  if (translationStatus) lines.push(`translationStatus: ${translationStatus}`);

  lines.push('---');
  if (data.notes?.trim()) {
    lines.push('');
    lines.push('## Notes');
    lines.push('');
    lines.push(data.notes.trim());
  }
  return lines.join('\n') + '\n';
}

export function buildCategoryMarkdown(data, translationStatus) {
  const lines = ['---'];
  lines.push(`label: ${yamlString(data.label)}`);
  if (data.parentId) lines.push(`parentId: ${yamlString(data.parentId)}`);
  if (translationStatus) lines.push(`translationStatus: ${translationStatus}`);
  lines.push('---');
  return lines.join('\n') + '\n';
}

export function buildFixabilityMarkdown(data, translationStatus) {
  const lines = ['---'];
  lines.push(`brand: ${yamlString(data.brand)}`);
  lines.push(`categoryId: ${yamlString(data.categoryId)}`);
  lines.push(`score: ${Number(data.score)}`);
  lines.push(`summary: >\n  ${data.summary.trim().replace(/\n/g, '\n  ')}`);
  const sources = (data.sources || '').split('\n').map((s) => s.trim()).filter(Boolean);
  if (sources.length > 0) {
    lines.push('sources:');
    sources.forEach((s) => lines.push(`  - ${yamlString(s)}`));
  } else {
    lines.push('sources: []');
  }
  lines.push(`updated: ${new Date().toISOString().slice(0, 10)}`);
  if (translationStatus) lines.push(`translationStatus: ${translationStatus}`);
  lines.push('---');
  return lines.join('\n') + '\n';
}

export function buildMaterialsMarkdown(data, translationStatus) {
  const lines = ['---'];
  lines.push(`name: ${yamlString(data.name)}`);
  if (data.categoryId) lines.push(`categoryId: ${yamlString(data.categoryId)}`);
  const bestFor = (data.bestFor || '').split('\n').map((s) => s.trim()).filter(Boolean);
  if (bestFor.length > 0) {
    lines.push('bestFor:');
    bestFor.forEach((s) => lines.push(`  - ${yamlString(s)}`));
  } else {
    lines.push('bestFor: []');
  }
  lines.push(`durability: ${data.durability}`);
  lines.push(`recyclability: ${data.recyclability}`);
  lines.push(`summary: >\n  ${data.summary.trim().replace(/\n/g, '\n  ')}`);
  if (translationStatus) lines.push(`translationStatus: ${translationStatus}`);
  lines.push('---');
  return lines.join('\n') + '\n';
}

// Minimal frontmatter parser - good enough for the flat/shallow schemas
// this app uses (matches what gray-matter would give us for these files),
// without pulling in a dependency that assumes Node's Buffer/fs.
export function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: '' };
  const [, fmText, body] = match;
  const data = {};
  const lines = fmText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const scalarMatch = line.match(/^(\w+):\s*(.*)$/);
    if (!scalarMatch) continue;
    const [, key, rest] = scalarMatch;
    if (rest === '' || rest === '[]') {
      // Could be a block scalar (>) or a list on following lines
      if (lines[i + 1]?.match(/^\s*-\s/)) {
        const items = [];
        let j = i + 1;
        while (lines[j]?.match(/^\s*-\s/)) {
          items.push(lines[j].replace(/^\s*-\s*/, '').trim().replace(/^"(.*)"$/, '$1'));
          j++;
        }
        data[key] = items;
        i = j - 1;
      } else {
        data[key] = rest === '[]' ? [] : '';
      }
    } else if (rest === '>') {
      const parts = [];
      let j = i + 1;
      while (lines[j]?.startsWith('  ')) {
        parts.push(lines[j].trim());
        j++;
      }
      data[key] = parts.join(' ');
      i = j - 1;
    } else {
      data[key] = rest.replace(/^"(.*)"$/, '$1');
    }
  }
  return { data, body: body.trim() };
}

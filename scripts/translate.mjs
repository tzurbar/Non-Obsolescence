// Generates machine-translated draft content from the English (source of truth)
// files in src/content/*/en/ into the other locale folders.
//
// Usage: npm run translate
//
// Backend is pluggable via env vars, so it can point at any OpenAI-compatible
// chat completions endpoint - including a locally hosted model - rather than
// a specific paid vendor:
//   TRANSLATION_API_URL   e.g. http://localhost:11434/v1/chat/completions
//   TRANSLATION_API_KEY   optional, omit for local servers that don't need one
//   TRANSLATION_MODEL     optional, defaults to "default"
//
// Without TRANSLATION_API_URL set, it still writes the draft files so the
// site structure/routing can be exercised, but each translated field is
// tagged "needs translation" instead of guessing.
//
// Safety rule: a target file already marked translationStatus: reviewed is
// never overwritten, even if the English source changed since - it's flagged
// as stale in the console output instead, so a human decides what to do.

import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content');
const TARGET_LOCALES = ['he', 'ar', 'es', 'pt'];
const LOCALE_NAMES = { he: 'Hebrew', ar: 'Arabic', es: 'Spanish', pt: 'Portuguese' };

const TRANSLATABLE_FIELDS = {
  guides: ['title', 'productName', 'category', 'estimatedTime', 'tools', 'steps', 'partLinks', 'videoLinks'],
  fixability: ['productCategory', 'summary'],
  materials: ['name', 'bestFor', 'summary']
};

// Within a translatable field's value, only string leaves under these keys get
// translated (e.g. a step's "text" and a link's "label"); everything else -
// urls, image paths, enums - passes through untouched.
const TRANSLATABLE_LEAF_KEYS = new Set(['text', 'title', 'label']);

async function translateText(text, targetLocale) {
  const endpoint = process.env.TRANSLATION_API_URL;
  if (!endpoint) {
    return `⟦needs translation to ${targetLocale}⟧ ${text}`;
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.TRANSLATION_API_KEY ? { Authorization: `Bearer ${process.env.TRANSLATION_API_KEY}` } : {})
    },
    body: JSON.stringify({
      model: process.env.TRANSLATION_MODEL || 'default',
      messages: [
        {
          role: 'system',
          content: `Translate the given text to ${LOCALE_NAMES[targetLocale]}. Reply with only the translated text, no notes or quotes.`
        },
        { role: 'user', content: text }
      ]
    })
  });
  if (!res.ok) {
    throw new Error(`Translation request failed (${res.status}): ${await res.text()}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() ?? text;
}

async function translateValue(value, targetLocale) {
  if (typeof value === 'string') return translateText(value, targetLocale);
  if (Array.isArray(value)) return Promise.all(value.map((item) => translateValue(item, targetLocale)));
  if (value && typeof value === 'object') {
    // e.g. a step's { text, image, partLinks, videoLinks }: translate text/label
    // leaves, recurse into nested arrays/objects (partLinks -> [{label, url}]),
    // leave other string leaves (image, url) untouched.
    const entries = await Promise.all(
      Object.entries(value).map(async ([key, val]) => {
        if (typeof val === 'string') {
          return [key, TRANSLATABLE_LEAF_KEYS.has(key) ? await translateText(val, targetLocale) : val];
        }
        return [key, await translateValue(val, targetLocale)];
      })
    );
    return Object.fromEntries(entries);
  }
  return value;
}

async function translateEntry(collection, sourceData, sourceBody, targetLocale) {
  const fields = TRANSLATABLE_FIELDS[collection] ?? [];
  const data = { ...sourceData };
  for (const field of fields) {
    if (field in data) data[field] = await translateValue(data[field], targetLocale);
  }
  data.translationStatus = 'machine';
  data.translationOf = `en/${sourceData.__slug}`;
  data.sourceUpdated = sourceData.__sourceUpdated;
  delete data.__slug;
  delete data.__sourceUpdated;

  const body = await translateText(sourceBody.trim(), targetLocale);
  return { data, body };
}

async function processCollection(collection) {
  const enDir = path.join(CONTENT_DIR, collection, 'en');
  if (!existsSync(enDir)) return;
  const files = (await readdir(enDir)).filter((f) => f.endsWith('.md'));

  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const sourcePath = path.join(enDir, file);
    const raw = await readFile(sourcePath, 'utf-8');
    const parsed = matter(raw);
    const sourceMtime = (await stat(sourcePath)).mtime;

    for (const locale of TARGET_LOCALES) {
      const targetDir = path.join(CONTENT_DIR, collection, locale);
      const targetPath = path.join(targetDir, file);

      if (existsSync(targetPath)) {
        const existing = matter(await readFile(targetPath, 'utf-8'));
        const existingSourceUpdated = existing.data.sourceUpdated ? new Date(existing.data.sourceUpdated) : null;
        const upToDate = existingSourceUpdated && existingSourceUpdated >= sourceMtime;

        if (existing.data.translationStatus === 'reviewed') {
          if (!upToDate) {
            console.log(`⚠️  ${collection}/${locale}/${file} is reviewed but the English source changed since — re-check by hand, not auto-overwritten.`);
          }
          continue;
        }
        if (upToDate) {
          console.log(`✓  ${collection}/${locale}/${file} already up to date`);
          continue;
        }
      }

      await mkdir(targetDir, { recursive: true });
      const { data, body } = await translateEntry(
        collection,
        { ...parsed.data, __slug: slug, __sourceUpdated: sourceMtime.toISOString() },
        parsed.content,
        locale
      );
      await writeFile(targetPath, matter.stringify(body, data));
      console.log(`→  wrote ${collection}/${locale}/${file} (draft)`);
    }
  }
}

for (const collection of Object.keys(TRANSLATABLE_FIELDS)) {
  await processCollection(collection);
}

if (!process.env.TRANSLATION_API_URL) {
  console.log('\nNote: TRANSLATION_API_URL is not set, so drafts contain "⟦needs translation⟧" placeholders instead of real translations.');
  console.log('Point it at any OpenAI-compatible chat endpoint (including a local model server) to generate real drafts.');
}

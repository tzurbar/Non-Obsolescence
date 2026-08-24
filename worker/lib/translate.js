// Translation, adapted for the manager tab: instead of scanning a local
// content/ tree for stale drafts (what scripts/translate.mjs does), this
// translates one just-saved entry into every target locale immediately,
// since the manager always knows exactly what changed. Same
// TRANSLATION_API_URL contract and same "needs translation" placeholder
// fallback when it isn't configured.

const TARGET_LOCALES = ['he', 'ar', 'es', 'pt'];
const LOCALE_NAMES = { he: 'Hebrew', ar: 'Arabic', es: 'Spanish', pt: 'Portuguese' };
const TRANSLATABLE_LEAF_KEYS = new Set(['text', 'title', 'label']);

async function translateText(text, targetLocale, env) {
  if (!text.trim()) return text; // nothing to translate - don't manufacture a placeholder out of blank input
  const endpoint = env.TRANSLATION_API_URL;
  if (!endpoint) return `⟦needs translation to ${targetLocale}⟧ ${text}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(env.TRANSLATION_API_KEY ? { Authorization: `Bearer ${env.TRANSLATION_API_KEY}` } : {})
    },
    body: JSON.stringify({
      model: env.TRANSLATION_MODEL || 'default',
      messages: [
        { role: 'system', content: `Translate the given text to ${LOCALE_NAMES[targetLocale]}. Reply with only the translated text, no notes or quotes.` },
        { role: 'user', content: text }
      ]
    })
  });
  if (!res.ok) throw new Error(`Translation request failed (${res.status}): ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() ?? text;
}

async function translateValue(value, targetLocale, env) {
  if (typeof value === 'string') return translateText(value, targetLocale, env);
  if (Array.isArray(value)) return Promise.all(value.map((item) => translateValue(item, targetLocale, env)));
  if (value && typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value).map(async ([key, val]) => {
        if (typeof val === 'string') {
          return [key, TRANSLATABLE_LEAF_KEYS.has(key) ? await translateText(val, targetLocale, env) : val];
        }
        return [key, await translateValue(val, targetLocale, env)];
      })
    );
    return Object.fromEntries(entries);
  }
  return value;
}

// fields: which top-level keys of `data` to translate. `data` values may be
// plain strings (translated directly) or arrays/objects (walked recursively,
// translating only text/title/label leaves).
export async function translateEntry({ data, fields, env, targetLocale }) {
  const translated = { ...data };
  for (const field of fields) {
    if (field in translated) translated[field] = await translateValue(translated[field], targetLocale, env);
  }
  return translated;
}

export { TARGET_LOCALES };

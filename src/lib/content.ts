// Update once the fresh-start repo is live under its final name/org.
export const githubRepoUrl = 'https://github.com/tzurbar/Non-Obsolescence';
export const githubEditBase = `${githubRepoUrl}/edit/main`;

export const locales = ['en', 'he', 'ar', 'es', 'pt'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const rtlLocales: Locale[] = ['he', 'ar'];

export function localeOf(entryId: string): string {
  return entryId.split('/')[0];
}

export function slugOf(entryId: string): string {
  return entryId.split('/').slice(1).join('/');
}

export function byLocale<T extends { id: string }>(entries: T[], locale: string): T[] {
  return entries.filter((entry) => localeOf(entry.id) === locale);
}

export function localePath(locale: string, path: string): string {
  const clean = path.replace(/^\/+/, '');
  return locale === defaultLocale ? `/${clean}` : `/${locale}/${clean}`;
}

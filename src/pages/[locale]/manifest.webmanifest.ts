import type { APIRoute } from 'astro';
import { manifestFor } from '../../lib/manifest';
import { locales, defaultLocale } from '../../lib/content';

export function getStaticPaths() {
  return locales.filter((locale) => locale !== defaultLocale).map((locale) => ({ params: { locale } }));
}

export const GET: APIRoute = ({ params }) => manifestFor(params.locale as string);

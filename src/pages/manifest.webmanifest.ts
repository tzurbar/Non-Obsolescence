import type { APIRoute } from 'astro';
import { manifestFor } from '../lib/manifest';
import { defaultLocale } from '../lib/content';

export const GET: APIRoute = () => manifestFor(defaultLocale);

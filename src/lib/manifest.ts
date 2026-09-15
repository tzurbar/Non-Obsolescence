// Web app manifest, generated per locale so adding the site to a phone's
// home screen from (say) the Hebrew pages gives a Hebrew-named app that
// opens back into Hebrew. Scope stays "/" so the language switcher still
// works inside the installed app instead of kicking out to a browser tab.

import { t as uiT } from './i18n';
import { defaultLocale, rtlLocales } from './content';

export function manifestFor(locale: string): Response {
  const s = uiT(locale);
  const body = {
    name: s.app.name,
    short_name: s.app.shortName,
    description: s.home.heroSubtitle,
    lang: locale,
    dir: rtlLocales.includes(locale as (typeof rtlLocales)[number]) ? 'rtl' : 'ltr',
    start_url: locale === defaultLocale ? '/' : `/${locale}/`,
    scope: '/',
    display: 'standalone',
    background_color: '#fafaf9',
    theme_color: '#ffffff',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' }
  });
}

export function manifestHref(locale: string): string {
  return locale === defaultLocale ? '/manifest.webmanifest' : `/${locale}/manifest.webmanifest`;
}

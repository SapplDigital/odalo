import type { APIRoute } from 'astro';

// PUBLIC_NOINDEX=true (demo deployment) disallows everything and omits the sitemap.
export const GET: APIRoute = ({ site }) => {
  const body = import.meta.env.PUBLIC_NOINDEX === 'true'
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${site?.origin ?? ''}${import.meta.env.BASE_URL.replace(/\/$/, '')}/sitemap.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
};

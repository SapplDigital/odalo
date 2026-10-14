import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${site?.origin ?? ''}${import.meta.env.BASE_URL.replace(/\/$/, '')}/sitemap.xml\n`, { headers: { 'Content-Type': 'text/plain' } });

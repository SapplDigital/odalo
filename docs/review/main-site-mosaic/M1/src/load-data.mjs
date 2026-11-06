import { register } from 'node:module';
register('./ts-resolve.mjs', import.meta.url);
// import.meta.env is undefined under plain Node: the app code reads it with optional access only in a few places; provide an empty object.
const m = await import('./entry.ts');
export const data = m.data;

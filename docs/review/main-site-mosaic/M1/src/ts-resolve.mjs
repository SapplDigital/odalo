// Tiny Node resolve hook: lets the prototype's build script import the app's own .ts content files (extensionless relative imports) without any bundler.
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve as pres } from 'node:path';
export async function resolve(spec, ctx, next) {
  if ((spec.startsWith('./') || spec.startsWith('../')) && !/\.[a-z]+$/.test(spec) && ctx.parentURL) {
    const base = dirname(fileURLToPath(ctx.parentURL));
    for (const ext of ['.ts', '/index.ts']) { const p = pres(base, spec + ext); if (existsSync(p)) return next(pathToFileURL(p).href, ctx); }
  }
  return next(spec, ctx);
}

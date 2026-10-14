import { launch } from './browser.mjs';
const [,, url, w = '1440', expr] = process.argv;
const b = await launch();
const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto(url, { waitUntil: 'networkidle' });
console.log(JSON.stringify(await p.evaluate(expr), null, 1));
await b.close();

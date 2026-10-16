// What the site imports: the tile inventory and the arrangements (symbols + wordmark), centred in one shared viewBox,
// with the optimiser's slot permutation applied (tile identity -> pose).
import { LOGO_TILES, LOGO_RAW, LOGO_SYMBOLS, LOGO_VIEWBOX, centred } from './logo-base.js';
import { LOGO_PERMS, LOGO_PLANS } from './logo-plan.js';

export { LOGO_TILES, LOGO_SYMBOLS, LOGO_VIEWBOX, LOGO_PLANS };

export function arranged(name) {
  const raw = LOGO_RAW[name], perm = LOGO_PERMS[name];
  return perm ? Object.fromEntries(Object.keys(raw).map((id) => [id, raw[perm[id] ?? id]])) : raw;
}
/** @type {Record<string, Record<string, {x: number, y: number, r: number}>>} */
export const LOGO_ARRANGEMENTS = Object.fromEntries(Object.keys(LOGO_RAW).map((n) => [n, centred(arranged(n))]));

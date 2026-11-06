/**
 * The approved commercial offer (single source for every price shown on the site).
 * - Website build: a ONE-OFF starting price, separate from the ongoing monthly care.
 * - Monthly plans: Base / Local / Captación have a monthly price. The 360 plan has NO fixed public price (`null` = custom quote);
 *   it must never be rendered as a number, zero or "free" (formatPrice/priceParts throw on a non-positive amount).
 * Not agreed yet (do not state anywhere): revisions, payment installments, minimum term, tax status, the precise 360 scope.
 */
export const websiteBuildFrom = 790; // EUR, one-off, "from"
export const monthlyPrice = { base: 59, local: 290, captacion: 590, '360': null as number | null }; // EUR per month; null = custom quote

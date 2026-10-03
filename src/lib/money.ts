/*
  Money is an integer number of kobo everywhere in this codebase and in the
  database (NGN 1 = 100 kobo). This module is the only place that converts it
  for display. DESIGN.md section 1 rule 7: use the naira sign with thousands
  separators and never show kobo.
*/
export function formatNaira(kobo: number): string {
  const naira = Math.round(kobo / 100);
  const sign = naira < 0 ? "-" : "";
  const digits = Math.abs(naira)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${sign}₦${digits}`;
}

/** The saving shown on a product card, from compare_at_kobo minus price_kobo. */
export function savingKobo(
  priceKobo: number,
  compareAtKobo: number | null,
): number {
  if (compareAtKobo === null || compareAtKobo <= priceKobo) return 0;
  return compareAtKobo - priceKobo;
}

/**
 * The struck-through compare-at price, wherever it appears.
 *
 * It is deliberately quiet: the live price is the thing being sold, and the
 * compare-at only shows what it used to be. Muted token at 55% opacity keeps the
 * line-through without letting the old price compete with the real one. Every
 * place that renders a compare-at uses this constant, so they cannot drift apart.
 *
 * Note this drops below the 4.5:1 that WCAG AA asks of body text. That is a
 * deliberate trade-off for a decorative "was" price that always sits beside a
 * fully legible live price, and the saving itself is carried by the Save pill,
 * which is left at full contrast.
 */
export const COMPARE_AT_CLASS = "text-ink-muted/55 line-through";
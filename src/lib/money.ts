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
/*
  FRD F16 and AGENTS.md rule 14.

  Money is an integer number of kobo everywhere, exactly as on the website. This
  is the ONLY place in the app that turns kobo into a display string, and it is a
  deliberate copy of src/lib/money.ts rather than a shared import, because the
  app and the website are two separate build systems and the alternative is
  coupling them.

  DESIGN.md section 1 rule 7: the naira sign with thousands separators, and never
  show kobo.
*/
export function formatNaira(kobo: number): string {
  const naira = Math.round(kobo / 100);
  const sign = naira < 0 ? "-" : "";
  const digits = Math.abs(naira)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${sign}\u20A6${digits}`;
}
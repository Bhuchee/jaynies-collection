/*
  Dates are formatted by hand rather than with toLocaleDateString, so the
  server and the client always produce the same string and there is no
  hydration mismatch. Dates are read in UTC, which matches the created_at
  default in the schema and the order number in lib/order-number.ts.
*/
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatOrderDate(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
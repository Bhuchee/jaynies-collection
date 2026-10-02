import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

/*
  FRD F8 step 7. Format JC-YYMMDD-XXXX, for example JC-261002-K7QP.
  The date part is UTC, which matches the created_at default in the schema.
*/
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const RANDOM_LENGTH = 4;
const MAX_ATTEMPTS = 5;

function randomCharacters(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let result = "";
  for (const byte of bytes) {
    result += ALPHABET[byte % ALPHABET.length];
  }
  return result;
}

export function generateOrderNumber(now: Date = new Date()): string {
  const year = String(now.getUTCFullYear()).slice(-2);
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  return `JC-${year}${month}${day}-${randomCharacters(RANDOM_LENGTH)}`;
}

/** Retries when the generated number is already taken. */
export async function createUniqueOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const orderNumber = generateOrderNumber();

    const [existing] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (!existing) return orderNumber;
  }

  throw new Error("Could not generate a unique order number. Please try again.");
}
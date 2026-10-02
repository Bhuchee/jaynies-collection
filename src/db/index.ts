import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local and to Vercel.");
}

const sql = neon(connectionString);

/** The single Drizzle client. Server-only: never import this in a client component. */
export const db = drizzle(sql, { schema });

export * from "./schema";
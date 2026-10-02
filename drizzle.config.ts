import { defineConfig } from "drizzle-kit";

/*
  drizzle-kit runs outside Next.js, so .env.local is loaded by hand.
  No dependency is added: process.loadEnvFile is built into Node 22.
*/
const loadEnvFile = (
  process as unknown as { loadEnvFile?: (path?: string) => void }
).loadEnvFile;

if (loadEnvFile) {
  try {
    loadEnvFile(".env.local");
  } catch {
    // Fine outside local development; Vercel injects the variables directly.
  }
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local before running drizzle-kit.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
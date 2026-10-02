import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";

/*
  FRD F6. Google only, database sessions, no middleware.
  The FRD keeps the plural table names (verification_tokens), so the adapter
  gets explicit table mappings instead of its singular defaults.
*/
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google],
  session: { strategy: "database" },
  pages: { signIn: "/signin" },
  /* Auth.js cannot infer the host behind the Vercel proxy. */
  trustHost: true,
});
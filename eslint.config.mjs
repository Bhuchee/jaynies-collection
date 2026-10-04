import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    /*
      AGENTS.md rule 21. mobile/ is a separate Expo project with its own
      node_modules, tsconfig and React Native types. Linting it with the
      website's config fails on every import, so it is ignored here. The app is
      type-checked separately with its own `npx tsc --noEmit` inside mobile/.
    */
    "mobile/**",
  ]),
]);

export default eslintConfig;

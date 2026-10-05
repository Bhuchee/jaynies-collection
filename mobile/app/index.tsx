/*
  FRD F16. The app's single entry point.

  This file re-exports the splash screen rather than duplicating it, so there is
  exactly one place that owns the launch sequence and the routing decision:
  splash -> (valid token) tabs, or -> Sign in.

  Routing lives in splash.tsx because it can only happen once both the fonts and
  the token check have finished. This route exists purely so the app has a
  "/" to land on.
*/

export { default } from "./splash";
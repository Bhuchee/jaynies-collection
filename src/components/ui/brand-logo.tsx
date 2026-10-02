"use client";

import { useState } from "react";

type BrandLogoProps = {
  /** "light" is the logo on white (header), "dark" is the logo on black (footer). */
  variant?: "light" | "dark";
  className?: string;
};

const SOURCES = {
  light: "/brand/logo.png",
  dark: "/brand/logo-dark-bg.png",
} as const;

/*
  DESIGN.md section 4. The real files are optional: until Brian drops them into
  public/brand/, a text wordmark is shown instead. An intrinsic-size img is used
  so the real logo keeps its own aspect ratio, with an onError fallback so this
  works on any host (the file is served from the CDN, not the function bundle).
*/
export function BrandLogo({ variant = "light", className = "" }: BrandLogoProps) {
  const [missing, setMissing] = useState(false);
  const size = "h-9 md:h-11";

  if (missing) {
    return (
      <span
        className={`${size} inline-flex items-center text-xl font-black uppercase tracking-[0.08em] md:text-2xl ${
          variant === "dark" ? "text-gold" : "text-gold-deep"
        } ${className}`}
      >
        JAYNIE
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- optional brand file with an automatic wordmark fallback; next/image cannot recover from a missing file.
    <img
      src={SOURCES[variant]}
      alt="Jaynie's Collection"
      className={`${size} w-auto ${className}`}
      onError={() => setMissing(true)}
    />
  );
}
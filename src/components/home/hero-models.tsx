"use client";

import { Shirt } from "lucide-react";
import { useState } from "react";

/*
  DESIGN.md section 6 and 9. Two cut-out model photos from public/brand/.
  The woman sits on the white plinth. Until the files exist, a Photo-grey slot
  holds the space so the hero keeps its shape.
*/
function Model({
  src,
  alt,
  label,
  className = "",
}: {
  src: string;
  alt: string;
  label: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-photo ${className}`}
      >
        <Shirt
          className="h-10 w-10 text-ink-muted"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          {label}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- optional cut-out with a placeholder fallback; next/image cannot recover from a missing file.
    <img
      src={src}
      alt={alt}
      className={`w-full object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

export function HeroModels() {
  return (
    <div className="flex items-end justify-center gap-4">
      <div className="relative flex w-1/2 items-end justify-center">
        <div
          aria-hidden="true"
          className="absolute bottom-0 h-2/3 w-full rounded-2xl bg-white"
        />
        <Model
          src="/brand/hero-woman-lilac.png"
          alt="Model wearing the lilac and cream hoodie set"
          label="Lilac set"
          className="relative z-10"
        />
      </div>

      <div className="w-1/2">
        <Model
          src="/brand/hero-man-ember.png"
          alt="Model wearing the ember camp-collar shirt"
          label="Ember shirt"
        />
      </div>
    </div>
  );
}
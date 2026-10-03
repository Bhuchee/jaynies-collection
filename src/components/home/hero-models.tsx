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
      /*
        A single h-* with w-auto gives both models the SAME rendered height from
        their own aspect ratios, which is what the layout needs. object-contain
        and object-bottom are kept as a safety net for any future file whose
        aspect differs from the space it is given.

        No background, border or shadow here: the cut-outs carry real alpha, so
        any of those would show as a visible box around the model.
      */
      className={`h-[12.5rem] w-auto object-contain object-bottom sm:h-[19rem] lg:h-[28rem] ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

export function HeroModels() {
  return (
    <div className="flex items-end justify-center">
      {/*
        The woman, on the white plinth from DESIGN.md section 6. The plinth is a
        sibling div behind her, not a background on the image itself.
      */}
      <div className="relative shrink-0">
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-1/3 rounded-2xl bg-white"
        />
        <Model
          src="/brand/hero-woman-lilac.png"
          alt="Model wearing the lilac and cream hoodie set"
          label="Lilac set"
          className="relative z-10"
        />
      </div>

      {/*
        -2.5rem of overlap between the two. Both files were trimmed to their
        alpha bounding box, so this margin overlaps the models themselves rather
        than transparent canvas.
      */}
      <Model
        src="/brand/hero-man-ember.png"
        alt="Model wearing the ember camp-collar shirt"
        label="Ember shirt"
        className="-ml-6 shrink-0 lg:-ml-10"
      />
    </div>
  );
}
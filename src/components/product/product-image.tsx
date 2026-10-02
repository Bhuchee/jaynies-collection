"use client";

import { Shirt } from "lucide-react";
import { useState } from "react";

type ProductImageProps = {
  src: string | null;
  alt: string;
  categoryLabel: string;
  className?: string;
};

/*
  DESIGN.md section 5. Every product image sits on the same light grey
  background in a 3:4 frame, 12px radius with a 1px line border. When the file
  is missing (or has not been added to public/products/ yet) the branded
  placeholder card is shown instead.
*/
export function ProductImage({
  src,
  alt,
  categoryLabel,
  className = "",
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;

  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-line bg-photo ${className}`}
    >
      {showPlaceholder ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3">
          <Shirt
            className="h-12 w-12 text-ink-muted"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
            {categoryLabel}
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- the product file is optional, so an intrinsic img with an onError fallback to the placeholder card is used instead of next/image.
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
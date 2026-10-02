"use client";

import { Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

/*
  FRD F13. Desktop: a 280px input in the header. Mobile: a Search icon that
  opens a full-width input under the header. Both submit to /shop?q= and carry
  the current category and gender so the filters are combined, not reset.
*/
export function SearchBar() {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const currentQuery = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const gender = searchParams.get("gender") ?? "";

  const hiddenFilters = (
    <>
      {category ? <input type="hidden" name="category" value={category} /> : null}
      {gender ? <input type="hidden" name="gender" value={gender} /> : null}
    </>
  );

  return (
    <>
      <form action="/shop" method="get" role="search" className="hidden lg:block">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            defaultValue={currentQuery}
            placeholder="Search hoodies, shirts, Ankara…"
            aria-label="Search products"
            className="h-11 w-[280px] rounded-lg border border-line bg-mist pl-10 pr-3 text-sm text-onyx placeholder:text-ink-muted"
          />
        </div>
        {hiddenFilters}
      </form>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-search"
        aria-label={open ? "Close search" : "Search"}
        className="flex h-11 w-11 items-center justify-center rounded border border-line text-onyx transition-opacity hover:opacity-85 lg:hidden"
      >
        {open ? (
          <X className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Search className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
        )}
      </button>

      {open ? (
        <div
          id="mobile-search"
          className="absolute inset-x-0 top-full border-b border-line bg-white p-4 lg:hidden"
        >
          <form action="/shop" method="get" role="search">
            <input
              type="search"
              name="q"
              defaultValue={currentQuery}
              autoFocus
              placeholder="Search hoodies, shirts, Ankara…"
              aria-label="Search products"
              className="h-12 w-full rounded-lg border border-line bg-mist px-4 text-sm text-onyx placeholder:text-ink-muted"
            />
            {hiddenFilters}
          </form>
        </div>
      ) : null}
    </>
  );
}
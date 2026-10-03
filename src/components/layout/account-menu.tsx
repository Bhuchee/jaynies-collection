"use client";

import { LogOut, Package, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { clearLocalCart } from "@/store/cart";

type AccountMenuProps = {
  name: string | null;
  email: string | null;
  image: string | null;
  signOutAction: () => Promise<void>;
};

function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email || "";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "JC";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/*
  FRD F6: the account menu holds the sign-out. Signed out, the button is a link
  to /signin. Signed in, it shows the Google avatar and a menu.
*/
export function AccountMenu({
  name,
  email,
  image,
  signOutAction,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        container.current &&
        !container.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!email) {
    return (
      <Link
        href="/signin"
        className="flex h-11 items-center gap-2 rounded border border-line px-4 text-[15px] font-semibold text-onyx transition-opacity hover:opacity-85"
      >
        <User className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        Sign in
      </Link>
    );
  }

  return (
    <div className="relative" ref={container}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-11 items-center gap-2 rounded border border-line px-2 transition-opacity hover:opacity-85"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- the Google avatar host is not known ahead of time, so no remote pattern can be configured.
          <img
            src={image}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-highlight text-xs font-semibold text-onyx">
            {initials(name, email)}
          </span>
        )}
        <span className="hidden max-w-24 truncate text-sm font-medium text-onyx sm:inline">
          {name ?? email}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-line bg-white p-2 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-onyx">
              {name ?? "Signed in"}
            </p>
            <p className="truncate text-xs text-ink-muted">{email}</p>
          </div>

          <Link
            href="/orders"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex h-11 items-center gap-2 rounded px-3 text-sm font-medium text-onyx hover:bg-mist"
          >
            <Package className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            My Orders
          </Link>

          <form
            action={signOutAction}
            /* FRD F5: clear the local cart on sign-out, so the next person on a
               shared device never sees it. The saved cart in Neon is untouched. */
            onSubmit={() => {
              clearLocalCart();
            }}
          >
            <button
              type="submit"
              role="menuitem"
              className="flex h-11 w-full items-center gap-2 rounded px-3 text-sm font-medium text-onyx hover:bg-mist"
            >
              <LogOut className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
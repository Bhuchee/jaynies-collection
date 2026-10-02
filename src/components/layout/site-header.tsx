import Link from "next/link";
import { auth, signOut } from "@/auth";
import { BrandLogo } from "@/components/ui/brand-logo";
import { AccountMenu } from "./account-menu";

/*
  Phase 2 header. It carries the brand mark and the account menu only.
  Phase 3 replaces this with the full DESIGN.md section 6 header: nav links,
  search, My Orders, cart badge and the mobile bottom nav.
*/
export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center"
          aria-label="Jaynie's Collection home"
        >
          <BrandLogo />
        </Link>

        <AccountMenu
          name={session?.user?.name ?? null}
          email={session?.user?.email ?? null}
          image={session?.user?.image ?? null}
          signOutAction={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        />
      </div>
    </header>
  );
}
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/*
  FRD F6: protected pages call auth() and redirect. No middleware.
  The order list and order detail land in phase 6; this stub exists so the
  sign-in guard can be tested on localhost and on production now.
*/
export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin?callbackUrl=/orders");
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-black uppercase tracking-[-0.01em]">
        My Orders
      </h1>
      <p className="mt-2 text-ink-muted">
        Signed in as {session.user.name ?? session.user.email}.
      </p>
      <p className="mt-8 rounded-lg border border-line bg-mist p-4 text-sm text-ink-muted">
        The order list and order detail pages are built in phase 6.
      </p>
    </main>
  );
}
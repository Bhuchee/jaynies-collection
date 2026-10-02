import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { GoogleIcon } from "@/components/icons/google";
import { BrandLogo } from "@/components/ui/brand-logo";

/* Only relative paths are accepted, so the page cannot be used as an open redirect. */
function safeCallbackUrl(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default async function SignInPage({
  searchParams,
}: PageProps<"/signin">) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);

  const session = await auth();
  if (session?.user) redirect(callbackUrl);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-line bg-white p-8 text-center">
        <BrandLogo className="mx-auto" />
        <h1 className="mt-6 text-xl font-black uppercase tracking-[-0.01em]">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Sign in to place an order and see your order history.
        </p>

        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-3 rounded border border-line bg-white px-6 text-[15px] font-semibold text-onyx transition-opacity hover:opacity-85"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        <p className="mt-4 text-sm text-ink-muted">
          We only use your name, email and photo, to fill in checkout.
        </p>
      </div>
    </main>
  );
}
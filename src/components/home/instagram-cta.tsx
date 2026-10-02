import { InstagramIcon } from "@/components/icons/instagram";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";

/* FRD F2 section 7. */
export function InstagramCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4">
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-mist px-6 py-12 text-center">
        <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-black uppercase tracking-[-0.01em] text-onyx">
          Follow @{INSTAGRAM_HANDLE}
        </h2>
        <p className="max-w-md text-ink-muted">
          New drops, colourways and behind-the-seams clips, posted first on
          Instagram.
        </p>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center gap-3 rounded bg-onyx px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-85"
        >
          <InstagramIcon className="h-5 w-5" />
          Follow on Instagram
        </a>
      </div>
    </section>
  );
}
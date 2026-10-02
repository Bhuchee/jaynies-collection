import Link from "next/link";
import { HeroModels } from "./hero-models";

/*
  DESIGN.md section 6, from Brian's design: a Mist card inset from the page
  edges, the stacked headline on the left with "Let's" on a white block and
  "Your" on a highlight block, and the two cut-out models on the right.
*/
function Sparkle({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none absolute text-line ${className}`}
    >
      <path d="M12 1.5 13.7 10.3 22.5 12 13.7 13.7 12 22.5 10.3 13.7 1.5 12 10.3 10.3Z" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="px-4 pt-4">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-mist px-6 py-10 sm:px-10 lg:py-16">
        <Sparkle className="left-[7%] top-[10%] h-6 w-6" />
        <Sparkle className="left-[34%] top-[5%] h-4 w-4" />
        <Sparkle className="bottom-[12%] left-[46%] h-5 w-5" />
        <Sparkle className="right-[7%] top-[14%] h-8 w-8" />
        <Sparkle className="bottom-[16%] right-[14%] h-6 w-6" />

        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-black uppercase leading-[1.05] tracking-[-0.01em] text-onyx">
              <span className="bg-white px-[0.15em] [box-decoration-break:clone]">
                Let&apos;s
              </span>
              <br />
              Elevate
              <br />
              <span className="bg-highlight px-[0.15em] [box-decoration-break:clone]">
                Your
              </span>
              <br />
              Fit.
            </h1>

            <p className="mt-6 max-w-md text-ink-muted">
              Drip that speaks louder than trends.
            </p>

            <Link
              href="/shop"
              className="mt-8 inline-flex h-12 items-center rounded bg-onyx px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-85"
            >
              Shop Now
            </Link>
          </div>

          <HeroModels />
        </div>
      </div>
    </section>
  );
}
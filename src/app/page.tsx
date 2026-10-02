import Link from "next/link";
import { CategoryStrip } from "@/components/home/category-strip";
import { Hero } from "@/components/home/hero";
import { HowOrderingWorks } from "@/components/home/how-ordering-works";
import { InstagramCta } from "@/components/home/instagram-cta";
import { DeliveryBand } from "@/components/layout/delivery-band";
import { ProductCard } from "@/components/product/product-card";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionTitle } from "@/components/ui/section-title";
import { getBestSellers, getLatestProducts } from "@/lib/queries";

/*
  FRD F2. Hero, delivery band, categories, Best Selling, Clothes For You,
  how ordering works, then the Instagram call to action.
*/
export default async function HomePage() {
  const [bestSellers, latest] = await Promise.all([
    getBestSellers(3),
    getLatestProducts(8),
  ]);

  return (
    <main className="flex flex-1 flex-col">
      <Hero />

      <div className="mt-6">
        <DeliveryBand />
      </div>

      <div className="mt-16">
        <CategoryStrip />
      </div>

      <section className="mx-auto mt-20 w-full max-w-6xl px-4">
        <div className="text-center">
          <SectionTitle>Best Selling</SectionTitle>
          <p className="mx-auto mt-8 max-w-xl text-ink-muted">
            Get in on the trend with our curated selection of best-selling
            styles.
          </p>
        </div>

        {/* Mobile: a two-up scroll row. Desktop: three columns. */}
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:hidden">
          {bestSellers.map((product) => (
            <div key={product.id} className="w-[46%] shrink-0 snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <div className="mt-10 hidden gap-6 sm:grid sm:grid-cols-3">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mt-20 bg-cream py-16">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="text-center">
            <SectionTitle>Clothes For You</SectionTitle>
          </div>

          <ProductGrid products={latest} className="mt-10" />

          <div className="mt-10 text-center">
            <Link
              href="/shop"
              className="inline-flex h-12 items-center rounded border border-onyx bg-white px-6 text-[15px] font-semibold text-onyx transition-opacity hover:opacity-85"
            >
              View all
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-20">
        <HowOrderingWorks />
      </div>

      <div className="mt-20">
        <InstagramCta />
      </div>
    </main>
  );
}
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/add-to-cart";
import { ProductImage } from "@/components/product/product-image";
import { CATEGORY_LABELS, CATEGORY_SHORT_LABELS, GENDER_LABELS } from "@/lib/catalog";
import { formatNaira, savingKobo } from "@/lib/money";
import { getProductBySlug } from "@/lib/queries";

/*
  FRD F4. An unknown or inactive slug becomes a 404. On desktop the image is
  sticky on the left and the details sit on the right; on mobile the sticky
  bar in AddToCart carries the stepper and the button.
*/
export default async function ProductPage({
  params,
}: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const saving = savingKobo(product.priceKobo, product.compareAtKobo);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-32 md:pb-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            categoryLabel={CATEGORY_SHORT_LABELS[product.category]}
          />
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.06em] text-gold-deep">
            {CATEGORY_LABELS[product.category]}
          </p>

          <h1 className="mt-2 text-2xl font-black uppercase tracking-[-0.01em] text-onyx sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-xl font-semibold text-onyx">
              {formatNaira(product.priceKobo)}
            </span>
            {product.compareAtKobo ? (
              <span className="text-base font-normal text-ink-muted line-through">
                {formatNaira(product.compareAtKobo)}
              </span>
            ) : null}
            {saving > 0 ? (
              <span className="rounded-full bg-highlight px-3 py-1 text-xs font-semibold text-onyx">
                Save {formatNaira(saving)}
              </span>
            ) : null}
          </div>

          <p className="mt-6 text-ink-muted">{product.description}</p>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-ink-muted">Category</dt>
              <dd className="font-medium text-onyx">
                {CATEGORY_LABELS[product.category]}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-muted">Fit</dt>
              <dd className="font-medium text-onyx">
                {GENDER_LABELS[product.gender]}
              </dd>
            </div>
          </dl>

          <div className="mt-8">
            <AddToCart
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                imageUrl: product.imageUrl,
                priceKobo: product.priceKobo,
                sizes: product.sizes,
              }}
            />
          </div>

          <p className="mt-6 text-sm text-ink-muted">
            Made to order by Jaynie. Please allow 3–5 working days.
          </p>
        </div>
      </div>
    </main>
  );
}
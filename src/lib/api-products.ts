import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, type Product } from "@/db/schema";
import { CATEGORY_LABELS, GENDER_LABELS } from "@/lib/catalog";

/*
  FRD F14. Turns a product row into the DTO the app receives.

  Two things happen here that the website does not need:

    - imageUrl becomes ABSOLUTE, built from NEXT_PUBLIC_SITE_URL. The app has no
      origin of its own to resolve "/products/tee.webp" against, and it is not
      given the site URL to guess with. Never localhost: a physical phone cannot
      reach a laptop on :3000 (AGENTS.md rule 7).
    - categoryLabel and genderLabel come from lib/catalog.ts, so the app's chip
      text cannot drift from the website's.

  Money is passed through as integer kobo, untouched.
*/

function absoluteImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;

  /* An already-absolute URL is left alone, so a catalogue row holding a full
     https:// address keeps working. */
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  const base = process.env.NEXT_PUBLIC_SITE_URL;

  if (!base) {
    /* Absent on purpose: the deployed site always has it set. Returning the
       relative path keeps the API answering rather than throwing. */
    return imageUrl;
  }

  return new URL(imageUrl, base).toString();
}

export type ProductDto = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: Product["category"];
  gender: Product["gender"];
  priceKobo: number;
  compareAtKobo: number | null;
  imageUrl: string | null;
  sizes: string[];
  isBestSeller: boolean;
  categoryLabel: string;
  genderLabel: string;
};

export function toProductDto(product: Product): ProductDto {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    category: product.category,
    gender: product.gender,
    priceKobo: product.priceKobo,
    compareAtKobo: product.compareAtKobo,
    imageUrl: absoluteImageUrl(product.imageUrl),
    sizes: product.sizes,
    isBestSeller: product.isBestSeller,
    categoryLabel: CATEGORY_LABELS[product.category],
    genderLabel: GENDER_LABELS[product.gender],
  };
}

export async function getProductDtoBySlug(
  slug: string,
): Promise<ProductDto | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  return product ? toProductDto(product) : null;
}
import { count, sql } from "drizzle-orm";
import type { NewProduct } from "./schema";

/*
  FRD section 4. Upsert by slug, so this script can be run as many times as
  needed without creating duplicates.

  Prices are integer kobo. NGN 17,000 is 1_700_000.
  Descriptions are written by the builder: the FRD catalog does not include
  them, and the column is NOT NULL. Jaynie should review the wording.
*/

const CATALOG: NewProduct[] = [
  {
    slug: "mosaic-print-shirt",
    name: "Mosaic Print Shirt",
    description:
      "A short-sleeve shirt in a blue, gold and green mosaic print, cut with a relaxed camp collar and a straight hem.",
    category: "shirts",
    gender: "men",
    priceKobo: 1_700_000,
    imageUrl: "/products/shirt-mosaic.webp",
  },
  {
    slug: "gold-lattice-shirt",
    name: "Gold Lattice Shirt",
    description:
      "Gold, black and white diagonal lattice print on a soft, breathable cotton blend, cut straight for an easy everyday fit.",
    category: "shirts",
    gender: "unisex",
    priceKobo: 1_700_000,
    imageUrl: "/products/shirt-gold-lattice.webp",
    isBestSeller: true,
  },
  {
    slug: "ember-camp-collar-shirt",
    name: "Ember Camp-Collar Shirt",
    description:
      "Orange, black and white brushstrokes on a camp-collar shirt with a loose, holiday-ready drape.",
    category: "shirts",
    gender: "men",
    priceKobo: 1_700_000,
    imageUrl: "/products/shirt-ember-camp.webp",
  },
  {
    slug: "rust-brushstroke-shirt",
    name: "Rust Brushstroke Shirt",
    description:
      "A rust-toned abstract brushstroke print, finished with short sleeves and a clean straight hem.",
    category: "shirts",
    gender: "unisex",
    priceKobo: 1_700_000,
    imageUrl: "/products/shirt-rust.webp",
  },
  {
    slug: "ember-shirt-trouser-set",
    name: "Ember Long-Sleeve Shirt & Trouser Set",
    description:
      "The orange abstract print on a long-sleeve shirt, matched with grey trousers. Sold as a two-piece set and sewn to order.",
    category: "shirts",
    gender: "unisex",
    priceKobo: 4_200_000,
    compareAtKobo: 4_700_000,
    imageUrl: "/products/set-ember-longsleeve.webp",
  },
  {
    slug: "burgundy-hoodie-set",
    name: "Burgundy Hoodie & Joggers",
    description:
      "A burgundy heavyweight pullover with matching cuffed joggers, brushed inside for warmth. Both pieces are cut to order.",
    category: "hoodie-sets",
    gender: "unisex",
    priceKobo: 4_700_000,
    compareAtKobo: 5_400_000,
    imageUrl: "/products/set-burgundy.webp",
  },
  {
    slug: "olive-hoodie-set",
    name: "Olive Hoodie & Joggers",
    description:
      "An olive fleece pullover and cuffed joggers with gold-tipped drawstrings. Sold as a set and sewn to order in Nigeria.",
    category: "hoodie-sets",
    gender: "unisex",
    priceKobo: 4_600_000,
    compareAtKobo: 5_400_000,
    imageUrl: "/products/set-olive.webp",
  },
  {
    slug: "ash-hoodie-set",
    name: "Ash Hoodie & Joggers",
    description:
      "An ash grey heavyweight pullover with matching cuffed joggers. A quiet everyday set that goes with everything.",
    category: "hoodie-sets",
    gender: "unisex",
    priceKobo: 4_500_000,
    compareAtKobo: 5_400_000,
    imageUrl: "/products/set-ash.webp",
    isBestSeller: true,
  },
  {
    slug: "monochrome-hoodie-set",
    name: "Monochrome Hoodie & Joggers",
    description:
      "A black and white colour-block pullover with matching joggers, for a clean graphic look.",
    category: "hoodie-sets",
    gender: "unisex",
    priceKobo: 4_800_000,
    compareAtKobo: 5_400_000,
    imageUrl: "/products/set-monochrome.webp",
  },
  {
    slug: "lilac-cream-hoodie-set",
    name: "Lilac & Cream Hoodie Set",
    description:
      "A soft lilac and cream colour-block pullover with matching joggers, cut in a relaxed women's fit.",
    category: "hoodie-sets",
    gender: "women",
    priceKobo: 4_900_000,
    compareAtKobo: 5_400_000,
    imageUrl: "/products/set-lilac-cream.webp",
    isBestSeller: true,
  },
  {
    slug: "sky-onyx-hoodie-set",
    name: "Sky & Onyx Hoodie Set",
    description:
      "A sky blue and onyx black colour-block pullover with matching joggers, in a heavyweight brushed fleece.",
    category: "hoodie-sets",
    gender: "unisex",
    priceKobo: 4_800_000,
    compareAtKobo: 5_400_000,
    imageUrl: "/products/set-sky-onyx.webp",
  },
  {
    slug: "classic-hoodie",
    name: "Classic Hoodie",
    description:
      "Our plain heavyweight pullover with a small embroidered logo on the chest. The piece the rest of a wardrobe leans on.",
    category: "hoodie-sets",
    gender: "unisex",
    priceKobo: 2_700_000,
    imageUrl: null,
  },
  {
    slug: "classic-joggers",
    name: "Classic Joggers",
    description:
      "Cuffed, tapered joggers in brushed fleece with gold-tipped drawstrings. Wear them with the matching pullover.",
    category: "bottoms",
    gender: "unisex",
    priceKobo: 2_700_000,
    imageUrl: null,
  },
  {
    slug: "classic-shorts",
    name: "Classic Shorts",
    description:
      "Olive fleece shorts with an elastic waist and gold-tipped drawstrings, made for warm afternoons.",
    category: "bottoms",
    gender: "unisex",
    priceKobo: 2_700_000,
    imageUrl: null,
  },
  {
    slug: "utility-cargo-pants",
    name: "Utility Cargo Pants",
    description:
      "Khaki utility cargos with deep side pockets and a relaxed straight leg. Made to order.",
    category: "bottoms",
    gender: "unisex",
    priceKobo: 3_500_000,
    imageUrl: null,
  },
  {
    slug: "essential-tee",
    name: "Essential T-Shirt",
    description:
      "A white crew-neck tee in combed cotton with a small printed logo on the chest.",
    category: "tees-polos",
    gender: "unisex",
    priceKobo: 1_200_000,
    imageUrl: null,
  },
  {
    slug: "signature-polo",
    name: "Signature Polo",
    description:
      "A black pique polo with a gold embroidered logo and a soft collar that holds its shape.",
    category: "tees-polos",
    gender: "unisex",
    priceKobo: 1_500_000,
    imageUrl: null,
  },
  {
    slug: "ankara-bubu-gown",
    name: "Ankara Bubu Gown",
    description:
      "A flowing bubu gown in an orange, black and gold wax print, cut loose for comfort and finished by hand.",
    category: "ankara",
    gender: "women",
    priceKobo: 4_500_000,
    imageUrl: null,
  },
  {
    slug: "ankara-two-piece-shorts",
    name: "Ankara Two-Piece Shorts Set",
    description:
      "A crop top with matching shorts in an orange and gold wax print. Two easy pieces, sewn as a set.",
    category: "ankara",
    gender: "women",
    priceKobo: 2_500_000,
    imageUrl: null,
  },
  {
    slug: "ankara-wrap-skirt",
    name: "Ankara Wrap Skirt",
    description:
      "A midi wrap skirt in a black and gold wax print with a tie waist you can set to your own fit.",
    category: "ankara",
    gender: "women",
    priceKobo: 2_000_000,
    imageUrl: null,
  },
  {
    slug: "ankara-statement-gown",
    name: "Ankara Statement Gown",
    description:
      "A fitted mermaid gown with puff sleeves in a rust and gold wax print. Our most detailed piece, sewn to order.",
    category: "ankara",
    gender: "women",
    priceKobo: 7_000_000,
    imageUrl: null,
  },
];

/*
  A fixed base timestamp keeps the seed idempotent. Catalog row 1 is the
  newest, so "the 8 newest" on the home page is always rows 1 to 8.
*/
const CREATED_AT_BASE = new Date("2026-10-01T09:00:00.000Z").getTime();

/* drizzle-kit and tsx run outside Next.js, so .env.local is loaded by hand. */
const loadEnvFile = (
  process as unknown as { loadEnvFile?: (path?: string) => void }
).loadEnvFile;

if (loadEnvFile) {
  try {
    loadEnvFile(".env.local");
  } catch {
    // Fine outside local development; Vercel injects the variables directly.
  }
}

async function main(): Promise<void> {
  const { db, products, orders, orderItems, orderStatusEnum } = await import(
    "./index"
  );
  const { and, desc, eq, ilike, or } = await import("drizzle-orm");

  const rows = CATALOG.map((product, index) => ({
    ...product,
    createdAt: new Date(CREATED_AT_BASE - index * 60_000),
  }));

  await db
    .insert(products)
    .values(rows)
    .onConflictDoUpdate({
      target: products.slug,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        category: sql`excluded.category`,
        gender: sql`excluded.gender`,
        priceKobo: sql`excluded.price_kobo`,
        compareAtKobo: sql`excluded.compare_at_kobo`,
        imageUrl: sql`excluded.image_url`,
        sizes: sql`excluded.sizes`,
        isBestSeller: sql`excluded.is_best_seller`,
        isActive: sql`excluded.is_active`,
        createdAt: sql`excluded.created_at`,
      },
    });

  const [productCount] = await db.select({ value: count() }).from(products);
  const [orderCount] = await db.select({ value: count() }).from(orders);
  const [orderItemCount] = await db.select({ value: count() }).from(orderItems);

  const searchCount = async (term: string) => {
    const [row] = await db
      .select({ value: count() })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          or(
            ilike(products.name, `%${term}%`),
            ilike(products.description, `%${term}%`),
          ),
        ),
      );
    return row.value;
  };

  const newest = await db
    .select({ name: products.name })
    .from(products)
    .orderBy(desc(products.createdAt), products.name)
    .limit(8);

  const bestSellers = await db
    .select({ name: products.name })
    .from(products)
    .where(eq(products.isBestSeller, true))
    .orderBy(desc(products.createdAt), products.name);

  const [missingImages] = await db
    .select({ value: count() })
    .from(products)
    .where(sql`${products.imageUrl} is null`);

  console.log("");
  console.log("Seed complete.");
  console.log(`  catalog rows upserted: ${rows.length}`);
  console.log("");
  console.log("Row counts");
  console.log(`  products:    ${productCount.value}`);
  console.log(`  orders:      ${orderCount.value}`);
  console.log(`  order_items: ${orderItemCount.value}`);
  console.log("");
  console.log(`Best sellers (${bestSellers.length})`);
  for (const row of bestSellers) console.log(`  ${row.name}`);
  console.log("");
  console.log("Clothes For You, the 8 newest");
  for (const row of newest) console.log(`  ${row.name}`);
  console.log("");
  console.log("F13 search acceptance");
  console.log(`  "hoodie" matches: ${await searchCount("hoodie")} (expected 7)`);
  console.log(`  "ankara" matches: ${await searchCount("ankara")} (expected 4)`);
  console.log("");
  console.log(`Products waiting on an image: ${missingImages.value}`);
  console.log(`Order statuses: ${orderStatusEnum.enumValues.join(", ")}`);
  console.log("");
}

main().catch((error: unknown) => {
  console.error("Seed failed.");
  console.error(error);
  process.exit(1);
});
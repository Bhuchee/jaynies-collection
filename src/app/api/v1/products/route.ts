import { parseShopFilters } from "@/lib/catalog";
import { toProductDto } from "@/lib/api-products";
import { apiJson } from "@/lib/api-response";
import { getProducts } from "@/lib/queries";

/*
  FRD F14. GET /api/v1/products

  Public: a shopper can browse before signing in, exactly as on the website.
  The filters are parsed by the SAME parseShopFilters the shop page uses, so the
  app's chips cannot behave differently from the website's.
*/

export async function GET(request: Request) {
  const url = new URL(request.url);

  /* parseShopFilters handles the trimming, the 50-char cap and unknown values,
     which is why the API does not re-implement any of it. Undefined rather than
     null: the parser ignores anything that is not a usable string. */
  const filters = parseShopFilters({
    q: url.searchParams.get("q") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    gender: url.searchParams.get("gender") ?? undefined,
  });

  const all = await getProducts(filters);

  /* limit/offset are applied here rather than in the query because the shared
     getProducts is what the website uses and it returns the whole filtered set.
     Parsed defensively: a nonsense limit falls back to the default. */
  const parsedLimit = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
  const parsedOffset = Number.parseInt(url.searchParams.get("offset") ?? "", 10);

  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 60)
      : 24;
  const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0;

  return apiJson({
    products: all.slice(offset, offset + limit).map(toProductDto),
    total: all.length,
  });
}
import { getProductDtoBySlug } from "@/lib/api-products";
import { notFound, serverError } from "@/lib/api-response";

/* FRD F14. GET /api/v1/products/[slug]. Unknown or inactive slug is a 404. */

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;

    const product = await getProductDtoBySlug(slug);

    if (!product) return notFound("That piece is not available.");

    return Response.json(
      { product },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return serverError("GET /api/v1/products/[slug]", error);
  }
}
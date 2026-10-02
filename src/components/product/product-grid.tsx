import type { Product } from "@/db/schema";
import { ProductCard } from "./product-card";

/*
  FRD F3: two columns on mobile, three on tablet, four on desktop.
*/
export function ProductGrid({
  products,
  className = "",
}: {
  products: Product[];
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 ${className}`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
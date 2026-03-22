import { db } from "@/db";
import { products } from "@/db/schema";
import { sql } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ProductActions } from "@/components/products/product-actions";
import { ProductForm } from "@/components/products/product-form";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const allProducts = db
    .select()
    .from(products)
    .orderBy(sql`${products.sortOrder} ASC`)
    .all();

  return (
    <div>
      <Header title="Products">
        <ProductForm />
      </Header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {allProducts.map((product) => (
          <Card key={product.id} className="relative">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-stone-500 mt-1">
                    {product.description}
                  </p>
                )}
              </div>
              <Badge
                className={
                  product.isAvailable
                    ? "bg-green-100 text-green-800"
                    : "bg-stone-100 text-stone-500"
                }
              >
                {product.isAvailable ? "Available" : "Unavailable"}
              </Badge>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-2xl font-bold text-amber-700">
                {formatPrice(product.priceInCents)}
              </span>
              <ProductActions product={product} />
            </div>
          </Card>
        ))}

        {allProducts.length === 0 && (
          <Card className="col-span-full">
            <p className="text-stone-400 text-center py-8">
              No products yet. Add your first sourdough product above.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ProductsClient } from "./products-client";

export default async function ProdutosPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("product_types")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Tipos de peças que você atende, separados por móveis e automotivo."
      />
      <ProductsClient products={products ?? []} />
    </div>
  );
}

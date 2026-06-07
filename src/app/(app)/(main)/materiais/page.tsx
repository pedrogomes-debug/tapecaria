import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { MaterialsClient } from "./materials-client";

export default async function MateriaisPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: materials } = await supabase
    .from("materials")
    .select("*")
    .eq("user_id", user.id)
    .order("category")
    .order("name");

  return (
    <div>
      <PageHeader
        title="Matéria-prima"
        description="Cadastre por unidade ou importe em lote via Excel: tecidos, espumas, madeiras, chapas, plumantes e aviamentos."
      />
      <MaterialsClient materials={materials ?? []} />
    </div>
  );
}

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ClientsClient } from "./clients-client";

export default async function ClientesPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Cadastro, contato e dados do veículo para o segmento automotivo."
      />
      <ClientsClient clients={clients ?? []} />
    </div>
  );
}

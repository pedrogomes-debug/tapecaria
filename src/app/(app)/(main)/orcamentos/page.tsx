import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { BudgetsList } from "./budgets-list";

export default async function OrcamentosPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data }, { data: clientRows }] = await Promise.all([
    supabase
      .from("budgets")
      .select(
        "id, title, status, sale_price, total_cost, profit_amount, created_at, client_id"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name").eq("user_id", user.id),
  ]);

  const clientMap = new Map((clientRows ?? []).map((c) => [c.id, c.name]));

  const budgets = (data ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    status: b.status,
    sale_price: b.sale_price,
    total_cost: b.total_cost,
    profit_amount: b.profit_amount,
    created_at: b.created_at,
    client_name: b.client_id ? clientMap.get(b.client_id) ?? null : null,
  }));

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Acompanhe seus orçamentos do rascunho à aprovação."
      >
        <Button asChild>
          <Link href="/orcamentos/novo">
            <Plus className="h-4 w-4" /> Novo orçamento
          </Link>
        </Button>
      </PageHeader>
      <BudgetsList budgets={budgets} />
    </div>
  );
}

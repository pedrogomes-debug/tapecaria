import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Plus,
  ArrowRight,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BUDGET_STATUS_MAP } from "@/lib/constants";
import type { BudgetStatus } from "@/lib/database.types";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: budgets }, { data: clientRows }] = await Promise.all([
    supabase
      .from("budgets")
      .select(
        "id, title, status, sale_price, profit_amount, created_at, client_id"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name").eq("user_id", user.id),
  ]);

  const clientMap = new Map(
    (clientRows ?? []).map((c) => [c.id, c.name])
  );
  const all = budgets ?? [];
  const approved = all.filter((b) => b.status === "aprovado");
  const approvedRevenue = approved.reduce(
    (acc, b) => acc + Number(b.sale_price),
    0
  );
  const approvedProfit = approved.reduce(
    (acc, b) => acc + Number(b.profit_amount),
    0
  );
  const avgTicket = approved.length
    ? approvedRevenue / approved.length
    : 0;

  const cards = [
    {
      label: "Orçamentos",
      value: String(all.length),
      icon: FileText,
    },
    {
      label: "Aprovados",
      value: String(approved.length),
      icon: CheckCircle2,
    },
    {
      label: "Faturamento aprovado",
      value: formatCurrency(approvedRevenue),
      icon: DollarSign,
    },
    {
      label: "Lucro estimado",
      value: formatCurrency(approvedProfit),
      icon: TrendingUp,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Painel"
        description="Visão geral do seu ateliê."
      >
        <Button asChild>
          <Link href="/orcamentos/novo">
            <Plus className="h-4 w-4" /> Novo orçamento
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Orçamentos recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orcamentos">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {all.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum orçamento ainda.
              </p>
            ) : (
              all.slice(0, 6).map((b) => {
                const status = BUDGET_STATUS_MAP[b.status as BudgetStatus];
                const clientName = b.client_id
                  ? clientMap.get(b.client_id)
                  : null;
                return (
                  <Link
                    key={b.id}
                    href={`/orcamentos/${b.id}`}
                    className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium">{b.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {clientName || "Sem cliente"} ·{" "}
                        {formatDate(b.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <span className="font-semibold">
                        {formatCurrency(Number(b.sale_price))}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ticket médio</span>
              <span className="font-semibold">{formatCurrency(avgTicket)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Taxa de aprovação</span>
              <span className="font-semibold">
                {all.length
                  ? Math.round((approved.length / all.length) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="rounded-lg bg-accent p-4">
              <p className="text-xs text-accent-foreground/80">
                Configure seus custos
              </p>
              <p className="mb-3 mt-1 text-sm text-accent-foreground">
                Mantenha custos fixos e margem atualizados para preços precisos.
              </p>
              <Button size="sm" variant="secondary" asChild>
                <Link href="/configuracoes/custos">Ajustar custos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { BUDGET_STATUS_MAP } from "@/lib/constants";
import type { BudgetStatus } from "@/lib/database.types";
import { StatusControl } from "./status-control";
import { PrintButton } from "./print-button";
import { DownloadPdfButton } from "./download-pdf-button";

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: budget } = await supabase
    .from("budgets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!budget) notFound();

  const [{ data: items }, { data: assignments }, clientRes, productRes] =
    await Promise.all([
    supabase
      .from("budget_items")
      .select("*")
      .eq("budget_id", id)
      .order("created_at"),
    supabase
      .from("budget_assignments")
      .select("*")
      .eq("budget_id", id)
      .order("created_at"),
    budget.client_id
      ? supabase
          .from("clients")
          .select("name, phone, email, vehicle_info")
          .eq("id", budget.client_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    budget.product_type_id
      ? supabase
          .from("product_types")
          .select("name")
          .eq("id", budget.product_type_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const client = clientRes.data;
  const productType = productRes.data;

  const status = BUDGET_STATUS_MAP[budget.status as BudgetStatus];
  const materialItems = (items ?? []).filter((i) => i.kind === "material");
  const extraItems = (items ?? []).filter((i) => i.kind === "extra");

  const profile = await supabase
    .from("profiles")
    .select("company_name, owner_name, phone")
    .eq("id", user.id)
    .maybeSingle();
  const company =
    profile.data?.company_name || profile.data?.owner_name || "Meu ateliê";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/orcamentos">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <StatusControl id={budget.id} status={budget.status as BudgetStatus} />
          <Button variant="outline" asChild>
            <Link href={`/orcamentos/${budget.id}/editar`}>
              <Pencil className="h-4 w-4" /> Editar
            </Link>
          </Button>
          <PrintButton />
          <DownloadPdfButton
            data={{
              company,
              companyPhone: profile.data?.phone ?? null,
              title: budget.title,
              clientName: client?.name ?? null,
              createdAt: budget.created_at,
              validUntil: budget.valid_until,
              serviceDescription: budget.service_description,
              salePrice: Number(budget.sale_price),
            }}
          />
        </div>
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">{company}</p>
              <CardTitle className="mt-1 text-2xl">{budget.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Emitido em {formatDate(budget.created_at)}
                {budget.valid_until
                  ? ` · válido até ${formatDate(budget.valid_until)}`
                  : ""}
              </p>
            </div>
            <Badge variant={status.variant} className="print:hidden">
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {client ? (
            <div className="rounded-lg bg-muted/40 p-4 text-sm">
              <p className="font-medium">Cliente: {client.name}</p>
              <div className="text-muted-foreground">
                {client.phone ? <span>{client.phone} · </span> : null}
                {client.email ? <span>{client.email}</span> : null}
                {client.vehicle_info ? (
                  <div>Veículo: {client.vehicle_info}</div>
                ) : null}
              </div>
              {productType ? (
                <p className="mt-1 text-muted-foreground">
                  Produto: {productType.name}
                </p>
              ) : null}
            </div>
          ) : null}

          {budget.service_description ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                Descritivo do serviço
              </h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {budget.service_description}
              </p>
            </div>
          ) : null}

          <div>
            <h3 className="mb-2 text-sm font-semibold">Materiais</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Custo unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      Sem materiais lançados.
                    </TableCell>
                  </TableRow>
                ) : (
                  materialItems.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.description}</TableCell>
                      <TableCell className="text-right">
                        {Number(i.quantity)} {i.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(i.unit_cost))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(i.total))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {extraItems.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.description} (extra)</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(i.total))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {assignments && assignments.length > 0 ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Execução</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Horas</TableHead>
                    <TableHead className="text-right">Custo/hora</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell className="text-right">
                        {Number(a.hours)}h
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(a.hourly_cost))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(a.total))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 text-sm">
              <h3 className="text-sm font-semibold">Composição de custo</h3>
              <Line label="Matéria-prima" value={Number(budget.materials_cost)} />
              <Line label="Mão de obra" value={Number(budget.labor_cost)} />
              <Line label="Custos fixos" value={Number(budget.fixed_cost)} />
              <Separator />
              <Line
                label="Custo total"
                value={Number(budget.total_cost)}
                bold
              />
            </div>
            <div className="space-y-2 text-sm">
              <h3 className="text-sm font-semibold">Margem e impostos</h3>
              <Line
                label={`Impostos (${formatPercent(Number(budget.tax_rate))})`}
                value={Number(budget.sale_price) * Number(budget.tax_rate)}
                muted
              />
              <Line
                label={`Taxa cartão (${formatPercent(Number(budget.card_fee))})`}
                value={Number(budget.sale_price) * Number(budget.card_fee)}
                muted
              />
              <Line
                label="Lucro líquido"
                value={Number(budget.profit_amount)}
                className="text-emerald-600"
              />
            </div>
          </div>

          {budget.notes ? (
            <div className="rounded-lg border p-4 text-sm">
              <p className="mb-1 font-medium">Observações</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {budget.notes}
              </p>
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-lg bg-primary p-5 text-primary-foreground">
            <span className="text-sm font-medium opacity-90">
              Valor do orçamento
            </span>
            <span className="text-3xl font-bold">
              {formatCurrency(Number(budget.sale_price))}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Line({
  label,
  value,
  bold,
  muted,
  className,
}: {
  label: string;
  value: number;
  bold?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span
        className={`${bold ? "font-bold" : "font-medium"} ${className ?? ""}`}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

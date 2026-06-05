import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCostSettings } from "@/lib/queries";
import { fixedCostPerHour } from "@/lib/pricing";
import { PageHeader } from "@/components/page-header";
import { BudgetForm, type BudgetFormInitial } from "../../budget-form";
import type { Segment } from "@/lib/database.types";

export default async function EditarOrcamentoPage({
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

  const [{ data: clients }, { data: productTypes }, { data: materials }, { data: items }, settings] =
    await Promise.all([
      supabase.from("clients").select("*").eq("user_id", user.id).order("name"),
      supabase
        .from("product_types")
        .select("*")
        .eq("user_id", user.id)
        .order("name"),
      supabase
        .from("materials")
        .select("*")
        .eq("user_id", user.id)
        .order("name"),
      supabase.from("budget_items").select("*").eq("budget_id", id),
      getCostSettings(user.id),
    ]);

  const defaults = {
    laborHourlyRate: settings.labor_hourly_rate,
    fixedCostPerHour: fixedCostPerHour(
      settings.fixed_costs,
      settings.productive_hours
    ),
    taxRate: settings.default_tax_rate,
    profitMargin: settings.default_profit_margin,
    cardFee: settings.default_card_fee,
  };

  let mk = 0;
  const initial: BudgetFormInitial = {
    id: budget.id,
    title: budget.title,
    client_id: budget.client_id,
    product_type_id: budget.product_type_id,
    segment: budget.segment as Segment,
    notes: budget.notes,
    valid_until: budget.valid_until,
    labor_cost: Number(budget.labor_cost),
    fixed_cost: Number(budget.fixed_cost),
    labor_hours: Number(budget.labor_hours),
    tax_rate: Number(budget.tax_rate),
    profit_margin: Number(budget.profit_margin),
    card_fee: Number(budget.card_fee),
    materialLines: (items ?? [])
      .filter((i) => i.kind === "material")
      .map((i) => ({
        key: `e${mk++}`,
        material_id: i.material_id,
        description: i.description,
        quantity: Number(i.quantity),
        unit: i.unit ?? "un",
        unit_cost: Number(i.unit_cost),
      })),
    extraLines: (items ?? [])
      .filter((i) => i.kind === "extra")
      .map((i) => ({
        key: `x${mk++}`,
        description: i.description,
        amount: Number(i.total),
      })),
  };

  return (
    <div>
      <PageHeader
        title="Editar orçamento"
        description="Atualize materiais, mão de obra e margem."
      />
      <BudgetForm
        clients={clients ?? []}
        productTypes={productTypes ?? []}
        materials={materials ?? []}
        defaults={defaults}
        initial={initial}
      />
    </div>
  );
}

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCostSettings } from "@/lib/queries";
import { fixedCostPerHour } from "@/lib/pricing";
import { PageHeader } from "@/components/page-header";
import { BudgetForm } from "../budget-form";

export default async function NovoOrcamentoPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [
    { data: clients },
    { data: productTypes },
    { data: materials },
    { data: employees },
    settings,
  ] = await Promise.all([
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
    supabase
      .from("employees")
      .select("*")
      .eq("user_id", user.id)
      .order("name"),
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

  return (
    <div>
      <PageHeader
        title="Novo orçamento"
        description="Some materiais, mão de obra e custos fixos para chegar ao preço com a margem desejada."
      />
      <BudgetForm
        clients={clients ?? []}
        productTypes={productTypes ?? []}
        materials={materials ?? []}
        employees={employees ?? []}
        defaults={defaults}
      />
    </div>
  );
}

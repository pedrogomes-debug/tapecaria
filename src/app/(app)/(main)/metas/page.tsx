import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCostSettings } from "@/lib/queries";
import { totalFixedCosts } from "@/lib/pricing";
import { PageHeader } from "@/components/page-header";
import { MetasClient } from "./metas-client";

export default async function MetasPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const settings = await getCostSettings(user.id);

  const { data: budgets } = await supabase
    .from("budgets")
    .select("sale_price, labor_hours")
    .eq("user_id", user.id);

  const prices = (budgets ?? [])
    .map((b) => Number(b.sale_price))
    .filter((v) => v > 0);
  const hours = (budgets ?? [])
    .map((b) => Number(b.labor_hours))
    .filter((v) => v > 0);

  const avgTicket =
    prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : 0;
  const avgHours =
    hours.length > 0
      ? Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 10) / 10
      : 0;

  return (
    <div>
      <PageHeader
        title="Meta de pró-labore"
        description="Defina quanto você quer tirar por mês e veja o quanto precisa faturar e trabalhar para chegar lá."
      />
      <MetasClient
        defaults={{
          prolaboreGoal: settings.prolabore_goal,
          fixedCosts: totalFixedCosts(settings.fixed_costs),
          taxRate: settings.default_tax_rate,
          cardFee: settings.default_card_fee,
          variableCostRate: settings.variable_cost_rate,
          productiveHours: settings.productive_hours,
          avgTicket,
          avgHours,
        }}
      />
    </div>
  );
}

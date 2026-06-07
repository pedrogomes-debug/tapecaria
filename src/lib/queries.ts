import { createClient } from "@/lib/supabase/server";
import type { CostSettings } from "@/lib/database.types";

export const DEFAULT_COST_SETTINGS: Omit<
  CostSettings,
  "id" | "user_id" | "created_at" | "updated_at"
> = {
  fixed_costs: [],
  productive_hours: 160,
  labor_hourly_rate: 25,
  default_tax_rate: 0.06,
  default_profit_margin: 0.3,
  default_card_fee: 0.0399,
  prolabore_goal: 0,
  variable_cost_rate: 0.45,
};

export async function getCostSettings(
  userId: string
): Promise<
  Pick<
    CostSettings,
    | "fixed_costs"
    | "productive_hours"
    | "labor_hourly_rate"
    | "default_tax_rate"
    | "default_profit_margin"
    | "default_card_fee"
    | "prolabore_goal"
    | "variable_cost_rate"
  >
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cost_settings")
    .select(
      "fixed_costs, productive_hours, labor_hourly_rate, default_tax_rate, default_profit_margin, default_card_fee, prolabore_goal, variable_cost_rate"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return DEFAULT_COST_SETTINGS;
  return {
    fixed_costs: (data.fixed_costs as CostSettings["fixed_costs"]) ?? [],
    productive_hours: Number(data.productive_hours),
    labor_hourly_rate: Number(data.labor_hourly_rate),
    default_tax_rate: Number(data.default_tax_rate),
    default_profit_margin: Number(data.default_profit_margin),
    default_card_fee: Number(data.default_card_fee),
    prolabore_goal: Number(data.prolabore_goal ?? 0),
    variable_cost_rate: Number(data.variable_cost_rate ?? 0.45),
  };
}

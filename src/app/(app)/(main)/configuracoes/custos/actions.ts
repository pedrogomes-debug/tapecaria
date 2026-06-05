"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FixedCostItem } from "@/lib/database.types";

export type CostActionState = { error: string | null; success: boolean };

function parseNumber(value: FormDataEntryValue | null): number {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export async function saveCostSettings(
  _prev: CostActionState,
  formData: FormData
): Promise<CostActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const names = formData.getAll("fixed_name").map((v) => String(v).trim());
  const amounts = formData.getAll("fixed_amount");
  const fixedCosts: FixedCostItem[] = names
    .map((name, i) => ({ name, amount: parseNumber(amounts[i] ?? null) }))
    .filter((c) => c.name.length > 0 || c.amount > 0);

  const payload = {
    user_id: user.id,
    fixed_costs: fixedCosts,
    productive_hours: parseNumber(formData.get("productive_hours")),
    labor_hourly_rate: parseNumber(formData.get("labor_hourly_rate")),
    default_tax_rate: parseNumber(formData.get("default_tax_rate")) / 100,
    default_profit_margin:
      parseNumber(formData.get("default_profit_margin")) / 100,
    default_card_fee: parseNumber(formData.get("default_card_fee")) / 100,
  };

  const { error } = await supabase
    .from("cost_settings")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/configuracoes/custos");
  revalidatePath("/orcamentos/novo");
  return { error: null, success: true };
}

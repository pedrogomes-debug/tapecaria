"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { computePricing } from "@/lib/pricing";
import type { BudgetStatus, Segment } from "@/lib/database.types";

export interface BudgetItemInput {
  kind: "material" | "extra";
  material_id?: string | null;
  description: string;
  quantity: number;
  unit?: string | null;
  unit_cost: number;
}

export interface BudgetAssignmentInput {
  employee_id: string | null;
  name: string;
  hours: number;
  hourly_cost: number;
}

export interface BudgetInput {
  id?: string;
  client_id?: string | null;
  product_type_id?: string | null;
  title: string;
  segment: Segment;
  notes?: string | null;
  valid_until?: string | null;
  fixed_cost_per_hour: number;
  tax_rate: number;
  profit_margin: number;
  card_fee: number;
  assignments: BudgetAssignmentInput[];
  items: BudgetItemInput[];
}

export type SaveBudgetResult =
  | { error: string; id?: undefined }
  | { error: null; id: string };

export async function saveBudget(
  input: BudgetInput
): Promise<SaveBudgetResult> {
  const user = await requireUser();
  const supabase = await createClient();

  if (!input.title?.trim()) {
    return { error: "Informe um título para o orçamento." };
  }

  const materialLines = input.items.filter((i) => i.kind === "material");
  const extraCost = input.items
    .filter((i) => i.kind === "extra")
    .reduce((acc, i) => acc + (i.quantity || 0) * (i.unit_cost || 0), 0);

  // Mao de obra a partir de quem executa: soma horas x custo/hora de cada um.
  const assignments = (input.assignments || []).filter(
    (a) => (a.hours || 0) > 0
  );
  const laborHours = assignments.reduce((acc, a) => acc + (a.hours || 0), 0);
  const laborCost = assignments.reduce(
    (acc, a) =>
      acc + Math.round((a.hours || 0) * (a.hourly_cost || 0) * 100) / 100,
    0
  );
  const effectiveRate = laborHours > 0 ? laborCost / laborHours : 0;

  // Recalcula no servidor para garantir integridade (nao confia no cliente).
  const pricing = computePricing({
    materials: materialLines.map((i) => ({
      quantity: i.quantity || 0,
      unitCost: i.unit_cost || 0,
    })),
    laborHours,
    laborHourlyRate: effectiveRate,
    fixedCostPerHour: input.fixed_cost_per_hour || 0,
    extraCost,
    taxRate: input.tax_rate || 0,
    profitMargin: input.profit_margin || 0,
    cardFee: input.card_fee || 0,
  });

  const budgetRow = {
    user_id: user.id,
    client_id: input.client_id || null,
    product_type_id: input.product_type_id || null,
    title: input.title.trim(),
    segment: input.segment,
    notes: input.notes?.trim() || null,
    valid_until: input.valid_until || null,
    materials_cost: pricing.materialsCost,
    labor_hours: laborHours,
    labor_cost: pricing.laborCost,
    fixed_cost: pricing.fixedCost,
    total_cost: pricing.totalCost,
    tax_rate: input.tax_rate || 0,
    profit_margin: input.profit_margin || 0,
    card_fee: input.card_fee || 0,
    sale_price: pricing.invalid ? 0 : pricing.salePrice,
    profit_amount: pricing.invalid ? 0 : pricing.profitAmount,
  };

  let budgetId = input.id;

  if (budgetId) {
    const { error } = await supabase
      .from("budgets")
      .update(budgetRow)
      .eq("id", budgetId);
    if (error) return { error: error.message };
    await supabase.from("budget_items").delete().eq("budget_id", budgetId);
    await supabase
      .from("budget_assignments")
      .delete()
      .eq("budget_id", budgetId);
  } else {
    const { data, error } = await supabase
      .from("budgets")
      .insert(budgetRow)
      .select("id")
      .single();
    if (error || !data) return { error: error?.message || "Erro ao salvar." };
    budgetId = data.id;
  }

  const items = [
    ...materialLines.map((i) => ({
      budget_id: budgetId!,
      user_id: user.id,
      kind: "material" as const,
      material_id: i.material_id || null,
      description: i.description || "Material",
      quantity: i.quantity || 0,
      unit: i.unit || null,
      unit_cost: i.unit_cost || 0,
      total: Math.round((i.quantity || 0) * (i.unit_cost || 0) * 100) / 100,
    })),
    ...input.items
      .filter((i) => i.kind === "extra")
      .map((i) => ({
        budget_id: budgetId!,
        user_id: user.id,
        kind: "extra" as const,
        material_id: null,
        description: i.description || "Extra",
        quantity: i.quantity || 0,
        unit: i.unit || null,
        unit_cost: i.unit_cost || 0,
        total: Math.round((i.quantity || 0) * (i.unit_cost || 0) * 100) / 100,
      })),
  ];

  if (items.length) {
    const { error } = await supabase.from("budget_items").insert(items);
    if (error) return { error: error.message };
  }

  if (assignments.length) {
    const assignmentRows = assignments.map((a) => ({
      budget_id: budgetId!,
      user_id: user.id,
      employee_id: a.employee_id || null,
      name: a.name || "Mão de obra",
      hours: a.hours || 0,
      hourly_cost: a.hourly_cost || 0,
      total: Math.round((a.hours || 0) * (a.hourly_cost || 0) * 100) / 100,
    }));
    const { error } = await supabase
      .from("budget_assignments")
      .insert(assignmentRows);
    if (error) return { error: error.message };
  }

  revalidatePath("/orcamentos");
  revalidatePath("/dashboard");
  return { error: null, id: budgetId! };
}

export async function updateBudgetStatus(
  id: string,
  status: BudgetStatus
): Promise<{ error: string | null }> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/orcamentos");
  revalidatePath(`/orcamentos/${id}`);
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteBudget(
  id: string
): Promise<{ error: string | null }> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/orcamentos");
  revalidatePath("/dashboard");
  return { error: null };
}

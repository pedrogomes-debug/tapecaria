"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type MetaResult = { error: string | null };

export async function saveProlaboreGoal(input: {
  prolabore_goal: number;
  variable_cost_rate: number;
}): Promise<MetaResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const payload = {
    user_id: user.id,
    prolabore_goal: Number.isFinite(input.prolabore_goal)
      ? Math.max(0, input.prolabore_goal)
      : 0,
    variable_cost_rate: Number.isFinite(input.variable_cost_rate)
      ? Math.min(0.99, Math.max(0, input.variable_cost_rate))
      : 0.45,
  };

  const { error } = await supabase
    .from("cost_settings")
    .upsert(payload, { onConflict: "user_id" });

  if (error) return { error: error.message };

  revalidatePath("/metas");
  return { error: null };
}

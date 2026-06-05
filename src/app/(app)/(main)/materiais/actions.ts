"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { MaterialCategory } from "@/lib/database.types";

export type ActionResult = { error: string | null };

function num(value: FormDataEntryValue | null): number {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export async function saveMaterial(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  const payload = {
    user_id: user.id,
    name: String(formData.get("name") || "").trim(),
    category: String(formData.get("category") || "outro") as MaterialCategory,
    unit: String(formData.get("unit") || "un").trim(),
    unit_cost: num(formData.get("unit_cost")),
    supplier: String(formData.get("supplier") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
  };

  if (!payload.name) return { error: "Informe o nome do material." };

  const query = id
    ? supabase.from("materials").update(payload).eq("id", id)
    : supabase.from("materials").insert(payload);

  const { error } = await query;
  if (error) return { error: error.message };

  revalidatePath("/materiais");
  return { error: null };
}

export async function deleteMaterial(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/materiais");
  return { error: null };
}

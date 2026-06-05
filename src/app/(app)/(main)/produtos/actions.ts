"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Segment } from "@/lib/database.types";

export type ActionResult = { error: string | null };

export async function saveProductType(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  const payload = {
    user_id: user.id,
    name: String(formData.get("name") || "").trim(),
    segment: String(formData.get("segment") || "moveis") as Segment,
    description: String(formData.get("description") || "").trim() || null,
  };

  if (!payload.name) return { error: "Informe o nome do produto." };

  const query = id
    ? supabase.from("product_types").update(payload).eq("id", id)
    : supabase.from("product_types").insert(payload);

  const { error } = await query;
  if (error) return { error: error.message };

  revalidatePath("/produtos");
  return { error: null };
}

export async function deleteProductType(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("product_types").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/produtos");
  return { error: null };
}

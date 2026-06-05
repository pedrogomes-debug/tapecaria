"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string | null };

export async function saveClient(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  const payload = {
    user_id: user.id,
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    document: String(formData.get("document") || "").trim() || null,
    address: String(formData.get("address") || "").trim() || null,
    kind: String(formData.get("kind") || "pessoa"),
    vehicle_info: String(formData.get("vehicle_info") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
  };

  if (!payload.name) return { error: "Informe o nome do cliente." };

  const query = id
    ? supabase.from("clients").update(payload).eq("id", id)
    : supabase.from("clients").insert(payload);

  const { error } = await query;
  if (error) return { error: error.message };

  revalidatePath("/clientes");
  return { error: null };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return { error: null };
}

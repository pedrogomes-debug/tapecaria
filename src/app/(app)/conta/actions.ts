"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Segment } from "@/lib/database.types";

export type ProfileResult = { error: string | null; success: boolean };

export async function updateProfile(
  _prev: ProfileResult,
  formData: FormData
): Promise<ProfileResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const payload = {
    id: user.id,
    company_name: String(formData.get("company_name") || "").trim() || null,
    owner_name: String(formData.get("owner_name") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    tax_regime: String(formData.get("tax_regime") || "").trim() || null,
    segment: String(formData.get("segment") || "ambos") as Segment,
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (error) return { error: error.message, success: false };

  revalidatePath("/conta");
  revalidatePath("/", "layout");
  return { error: null, success: true };
}

export type EmployeeResult = { error: string | null };

export async function saveEmployee(
  formData: FormData
): Promise<EmployeeResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  const payload = {
    user_id: user.id,
    name: String(formData.get("name") || "").trim(),
    role: String(formData.get("role") || "").trim() || null,
    monthly_salary: Number(formData.get("monthly_salary")) || 0,
    monthly_hours: Number(formData.get("monthly_hours")) || 220,
    active: true,
  };

  if (!payload.name) return { error: "Informe o nome do funcionário." };
  if (payload.monthly_hours <= 0) {
    return { error: "As horas mensais precisam ser maiores que zero." };
  }

  const query = id
    ? supabase.from("employees").update(payload).eq("id", id)
    : supabase.from("employees").insert(payload);

  const { error } = await query;
  if (error) return { error: error.message };

  revalidatePath("/conta");
  return { error: null };
}

export async function deleteEmployee(id: string): Promise<EmployeeResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/conta");
  return { error: null };
}

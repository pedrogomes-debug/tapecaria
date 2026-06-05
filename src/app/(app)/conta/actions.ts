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

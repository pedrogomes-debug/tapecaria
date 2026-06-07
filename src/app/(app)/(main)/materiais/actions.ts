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

export type ImportMaterialInput = {
  name: string;
  category?: string | null;
  unit?: string | null;
  unit_cost?: string | number | null;
  supplier?: string | null;
  notes?: string | null;
};

export type ImportResult = {
  error: string | null;
  inserted?: number;
  skipped?: number;
};

function normalizeCategory(value?: string | null): MaterialCategory {
  const v = String(value || "")
    .toLowerCase()
    .trim();
  if (v.includes("tecid")) return "tecido";
  if (v.includes("madeir")) return "madeira";
  if (v.includes("chapa") || v.includes("compensad") || v.includes("mdf"))
    return "chapa";
  if (v.includes("espuma")) return "espuma";
  if (v.includes("pluma") || v.includes("enchiment") || v.includes("fibra"))
    return "plumante";
  if (v.includes("aviament")) return "aviamento";
  return "outro";
}

export async function importMaterials(
  rows: ImportMaterialInput[]
): Promise<ImportResult> {
  const user = await requireUser();
  const supabase = await createClient();

  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "Nenhuma linha encontrada no arquivo." };
  }

  const valid = rows
    .map((r) => ({
      user_id: user.id,
      name: String(r.name || "").trim(),
      category: normalizeCategory(r.category),
      unit: String(r.unit || "un").trim() || "un",
      unit_cost: num(
        typeof r.unit_cost === "number" ? String(r.unit_cost) : r.unit_cost ?? ""
      ),
      supplier: String(r.supplier || "").trim() || null,
      notes: String(r.notes || "").trim() || null,
    }))
    .filter((r) => r.name.length > 0);

  const skipped = rows.length - valid.length;

  if (valid.length === 0) {
    return { error: "Nenhum material válido (todos sem nome).", skipped };
  }

  const { error } = await supabase.from("materials").insert(valid);
  if (error) return { error: error.message };

  revalidatePath("/materiais");
  return { error: null, inserted: valid.length, skipped };
}

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

export type ImportClientInput = {
  name: string;
  phone?: string | null;
  email?: string | null;
  kind?: string | null;
  document?: string | null;
  address?: string | null;
};

export type ImportResult = {
  error: string | null;
  inserted?: number;
  skipped?: number;
};

function normalizeKind(value?: string | null): "pessoa" | "empresa" {
  const v = String(value || "")
    .toLowerCase()
    .trim();
  if (
    v.includes("jur") ||
    v.includes("pj") ||
    v.includes("cnpj") ||
    v.includes("empresa")
  ) {
    return "empresa";
  }
  return "pessoa";
}

export async function importClients(
  rows: ImportClientInput[]
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
      phone: String(r.phone || "").trim() || null,
      email: String(r.email || "").trim() || null,
      kind: normalizeKind(r.kind),
      document: String(r.document || "").trim() || null,
      address: String(r.address || "").trim() || null,
      notes: null,
    }))
    .filter((r) => r.name.length > 0);

  const skipped = rows.length - valid.length;

  if (valid.length === 0) {
    return {
      error: "Nenhum cliente válido (todos sem nome).",
      skipped,
    };
  }

  const { error } = await supabase.from("clients").insert(valid);
  if (error) return { error: error.message };

  revalidatePath("/clientes");
  return { error: null, inserted: valid.length, skipped };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return { error: null };
}

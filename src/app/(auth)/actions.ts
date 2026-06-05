"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string | null };

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "E-mail ou senha invalidos." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const companyName = String(formData.get("company_name") || "").trim();
  const ownerName = String(formData.get("owner_name") || "").trim();
  const segment = String(formData.get("segment") || "ambos");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }
  if (password.length < 6) {
    return { error: "A senha precisa ter ao menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        company_name: companyName,
        owner_name: ownerName,
        segment,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Quando a confirmacao de e-mail esta ativa, o signUp nao retorna sessao.
  // Sem isso, o redirect para /dashboard seria revertido para /login sem
  // explicacao. Avisamos o usuario de forma clara.
  if (!data.session) {
    return {
      error:
        "Conta criada! Confirme seu e-mail para entrar (ou desative a confirmacao de e-mail no Supabase).",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Subscription } from "@/lib/database.types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export function isSubscriptionActive(sub: Subscription | null): boolean {
  if (!sub) return false;
  if (sub.status === "active" || sub.status === "trialing") {
    if (!sub.current_period_end) return true;
    return new Date(sub.current_period_end).getTime() > Date.now();
  }
  return false;
}

export async function getSubscription(): Promise<Subscription | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return data;
}

/**
 * Billing is only enforced when Pagar.me is configured. This keeps the app
 * fully usable in development before payment credentials are provided.
 */
export function isBillingEnabled(): boolean {
  return Boolean(process.env.PAGARME_SECRET_KEY);
}

export async function requireActiveSubscription() {
  if (!isBillingEnabled()) return null;
  const sub = await getSubscription();
  if (!isSubscriptionActive(sub)) {
    redirect("/assinatura");
  }
  return sub;
}

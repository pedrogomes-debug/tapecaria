"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import {
  createSubscription,
  normalizeSubscriptionStatus,
} from "@/lib/pagarme";
import type { SubscriptionStatus } from "@/lib/database.types";

export type SubscribeResult = { error: string | null };

export async function subscribe(params: {
  cardToken: string;
  name: string;
  email: string;
  document: string;
}): Promise<SubscribeResult> {
  const user = await requireUser();

  if (!process.env.PAGARME_SECRET_KEY) {
    return { error: "Pagamento não configurado. Defina PAGARME_SECRET_KEY." };
  }
  if (!params.cardToken) {
    return { error: "Não foi possível processar o cartão." };
  }

  try {
    const sub = await createSubscription({
      cardToken: params.cardToken,
      externalId: user.id,
      customer: {
        name: params.name,
        email: params.email || user.email || "",
        document: params.document,
      },
    });

    const status = normalizeSubscriptionStatus(
      sub.status
    ) as SubscriptionStatus;
    const periodEnd =
      sub.current_cycle?.end_at || sub.next_billing_at || null;

    const admin = createAdminClient();
    await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        pagarme_subscription_id: sub.id,
        pagarme_customer_id: sub.customer?.id ?? null,
        status,
        plan: process.env.PAGARME_PLAN_ID ?? "tapecei-mensal",
        current_period_end: periodEnd,
      },
      { onConflict: "user_id" }
    );

    revalidatePath("/assinatura");
    revalidatePath("/dashboard", "layout");
    return { error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao criar assinatura.";
    return { error: message };
  }
}

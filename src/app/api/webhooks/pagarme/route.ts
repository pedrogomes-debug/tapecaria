import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizeSubscriptionStatus } from "@/lib/pagarme";
import type { SubscriptionStatus } from "@/lib/database.types";

export const dynamic = "force-dynamic";

/**
 * Webhook do Pagar.me para eventos de assinatura/cobranca.
 * Configure no painel do Pagar.me apontando para /api/webhooks/pagarme.
 * Opcionalmente protegido por Basic Auth usando PAGARME_WEBHOOK_SECRET.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.PAGARME_WEBHOOK_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    const expected =
      "Basic " + Buffer.from(`${secret}:`).toString("base64");
    const expectedPair =
      "Basic " + Buffer.from(`${secret}:${secret}`).toString("base64");
    if (auth !== expected && auth !== expectedPair && auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const type = String(payload.type || "");
  const data = (payload.data || {}) as Record<string, unknown>;

  // Resolve subscription id + status conforme o tipo de evento.
  let subscriptionId: string | null = null;
  let rawStatus: string | null = null;
  let periodEnd: string | null = null;

  if (type.startsWith("subscription")) {
    subscriptionId = (data.id as string) || null;
    rawStatus = (data.status as string) || null;
    const cycle = data.current_cycle as { end_at?: string } | undefined;
    periodEnd = cycle?.end_at || (data.next_billing_at as string) || null;
  } else if (type.startsWith("charge") || type.startsWith("invoice")) {
    const sub = data.subscription as
      | { id?: string; status?: string }
      | undefined;
    subscriptionId =
      sub?.id || (data.subscription_id as string) || null;
    // charge.paid => ativo; charge.payment_failed => past_due
    if (type.includes("paid")) rawStatus = "active";
    else if (type.includes("failed")) rawStatus = "past_due";
    else rawStatus = sub?.status || null;
  }

  if (!subscriptionId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const status = (
    rawStatus ? normalizeSubscriptionStatus(rawStatus) : "pending"
  ) as SubscriptionStatus;

  const admin = createAdminClient();
  const update: { status: SubscriptionStatus; current_period_end?: string } = {
    status,
  };
  if (periodEnd) update.current_period_end = periodEnd;

  await admin
    .from("subscriptions")
    .update(update)
    .eq("pagarme_subscription_id", subscriptionId);

  return NextResponse.json({ received: true });
}

/**
 * Cliente minimo da API Pagar.me v5 (assinaturas recorrentes).
 * Docs: https://docs.pagar.me/reference
 *
 * A autenticacao usa Basic auth com a SECRET KEY como usuario e senha vazia.
 */

const API_BASE = "https://api.pagar.me/core/v5";

function authHeader(): string {
  const key = process.env.PAGARME_SECRET_KEY || "";
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

async function pagarmeFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const message =
      data?.message ||
      data?.errors?.[0]?.message ||
      `Erro Pagar.me (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export interface PagarmeCustomerInput {
  name: string;
  email: string;
  document: string;
  documentType?: "cpf" | "cnpj";
  phone?: string;
}

export interface PagarmeSubscription {
  id: string;
  status: string;
  customer?: { id: string };
  current_cycle?: { end_at?: string };
  next_billing_at?: string;
}

function mapStatus(status: string): string {
  switch (status) {
    case "active":
    case "trialing":
    case "paid":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "ended":
      return "canceled";
    case "pending":
    case "future":
      return "pending";
    default:
      return "pending";
  }
}

export function normalizeSubscriptionStatus(status: string): string {
  return mapStatus(status);
}

/**
 * Cria uma assinatura recorrente com cartao de credito.
 * Usa PAGARME_PLAN_ID quando definido; caso contrario monta um item com
 * cobranca mensal baseada em PAGARME_PLAN_AMOUNT (centavos).
 */
export async function createSubscription(params: {
  cardToken: string;
  customer: PagarmeCustomerInput;
  externalId: string;
}): Promise<PagarmeSubscription> {
  const planId = process.env.PAGARME_PLAN_ID;
  const amount = Number(process.env.PAGARME_PLAN_AMOUNT || 4790);
  const onlyDigits = params.customer.document.replace(/\D/g, "");
  const docType =
    params.customer.documentType ||
    (onlyDigits.length > 11 ? "cnpj" : "cpf");

  const body: Record<string, unknown> = {
    payment_method: "credit_card",
    interval: "month",
    interval_count: 1,
    billing_type: "prepaid",
    code: params.externalId,
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      document: onlyDigits,
      document_type: docType,
      type: docType === "cnpj" ? "company" : "individual",
    },
    card: { token: params.cardToken },
  };

  if (planId) {
    body.plan_id = planId;
  } else {
    body.items = [
      {
        description: "Assinatura Tapecei",
        quantity: 1,
        pricing_scheme: { scheme_type: "unit", price: amount },
      },
    ];
  }

  return pagarmeFetch<PagarmeSubscription>("/subscriptions", {
    method: "POST",
    body,
  });
}

export async function getSubscription(
  id: string
): Promise<PagarmeSubscription> {
  return pagarmeFetch<PagarmeSubscription>(`/subscriptions/${id}`);
}

export async function cancelSubscription(
  id: string
): Promise<PagarmeSubscription> {
  return pagarmeFetch<PagarmeSubscription>(`/subscriptions/${id}`, {
    method: "DELETE",
  });
}

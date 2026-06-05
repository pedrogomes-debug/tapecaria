import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import { requireUser, getSubscription, isSubscriptionActive, isBillingEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SubscribeForm } from "./subscribe-form";

const benefits = [
  "Orçamentos ilimitados com cálculo de custo e margem",
  "CRM de clientes e catálogo de matéria-prima",
  "Custos fixos rateados e impostos automáticos",
  "Móveis e automotivo no mesmo sistema",
  "Acesso no celular e no computador",
];

export default async function AssinaturaPage() {
  const user = await requireUser();
  const sub = await getSubscription();
  const active = isSubscriptionActive(sub);
  const billing = isBillingEnabled();
  const publicKey = process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY || "";
  const amount = Number(process.env.PAGARME_PLAN_AMOUNT || 4790) / 100;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name, owner_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Assinatura"
        description="Mantenha o acesso completo ao Tapecei."
      />

      {active ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            <h2 className="text-xl font-semibold">Assinatura ativa</h2>
            <p className="text-muted-foreground">
              {sub?.current_period_end
                ? `Seu acesso está garantido até ${formatDate(sub.current_period_end)}.`
                : "Seu acesso está ativo."}
            </p>
            <Badge variant="success">Ativa</Badge>
            <Button asChild className="mt-2">
              <Link href="/dashboard">Ir para o painel</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-primary">
            <CardHeader>
              <Badge className="w-fit">
                <Sparkles className="h-3 w-3" /> Plano Tapecei
              </Badge>
              <CardTitle className="mt-2 flex items-end gap-1">
                <span className="text-3xl font-bold">
                  {formatCurrency(amount)}
                </span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </CardTitle>
              <CardDescription>
                Tudo que seu ateliê precisa para precificar com lucro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {benefits.map((b) => (
                <div key={b} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{b}</span>
                </div>
              ))}
              {sub?.status === "past_due" ? (
                <p className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-700">
                  Seu pagamento está pendente. Atualize o cartão para reativar.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados de pagamento</CardTitle>
              <CardDescription>Cobrança mensal recorrente.</CardDescription>
            </CardHeader>
            <CardContent>
              {!billing ? (
                <div className="space-y-3 text-sm">
                  <p className="rounded-md bg-muted p-3 text-muted-foreground">
                    O pagamento ainda não foi configurado neste ambiente. Defina
                    as chaves do Pagar.me para ativar a cobrança. Enquanto isso,
                    o acesso está liberado.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard">Ir para o painel</Link>
                  </Button>
                </div>
              ) : !publicKey ? (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  Defina NEXT_PUBLIC_PAGARME_PUBLIC_KEY para habilitar o
                  formulário de cartão.
                </p>
              ) : (
                <SubscribeForm
                  publicKey={publicKey}
                  defaultName={
                    profile?.owner_name || profile?.company_name || ""
                  }
                  defaultEmail={user.email || ""}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

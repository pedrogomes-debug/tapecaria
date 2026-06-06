import Link from "next/link";
import { requireUser, getSubscription, isSubscriptionActive } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Employee, Segment } from "@/lib/database.types";
import { ProfileForm } from "./profile-form";
import { EmployeesManager } from "./employees-manager";

export default async function ContaPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name, owner_name, phone, tax_regime, segment")
    .eq("id", user.id)
    .maybeSingle();

  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  const sub = await getSubscription();
  const active = isSubscriptionActive(sub);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Minha conta" description="Dados do ateliê e assinatura." />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do ateliê</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <ProfileForm
            profile={{
              company_name: profile?.company_name ?? null,
              owner_name: profile?.owner_name ?? null,
              phone: profile?.phone ?? null,
              tax_regime: profile?.tax_regime ?? null,
              segment: (profile?.segment ?? "ambos") as Segment,
            }}
          />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Minha Tapeçaria</CardTitle>
            <CardDescription>
              Cadastre sua equipe e o salário de cada um. Esses valores são
              usados no orçamento para calcular a mão de obra de quem executa o
              serviço.
            </CardDescription>
          </CardHeader>
          <EmployeesManager employees={(employees ?? []) as Employee[]} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                {active ? (
                  <Badge variant="success">Ativa</Badge>
                ) : (
                  <Badge variant="secondary">
                    {sub?.status === "past_due" ? "Pagamento pendente" : "Inativa"}
                  </Badge>
                )}
              </div>
              {sub?.current_period_end ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Próxima renovação: {formatDate(sub.current_period_end)}
                </p>
              ) : null}
            </div>
            <Button asChild variant={active ? "outline" : "default"}>
              <Link href="/assinatura">
                {active ? "Gerenciar" : "Assinar"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { Target, TrendingUp, Clock, CalendarDays, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { saveProlaboreGoal } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatPercent } from "@/lib/utils";

export interface MetasDefaults {
  prolaboreGoal: number;
  fixedCosts: number;
  taxRate: number;
  cardFee: number;
  variableCostRate: number;
  productiveHours: number;
  avgTicket: number;
  avgHours: number;
}

const WORKDAYS = 22;
const WEEKS = 4.33;

export function MetasClient({ defaults }: { defaults: MetasDefaults }) {
  const [pending, startTransition] = useTransition();

  const [goal, setGoal] = useState(defaults.prolaboreGoal || 0);
  const [fixedCosts, setFixedCosts] = useState(defaults.fixedCosts || 0);
  const [variablePct, setVariablePct] = useState(
    (defaults.variableCostRate || 0) * 100
  );
  const [taxPct, setTaxPct] = useState((defaults.taxRate || 0) * 100);
  const [cardPct, setCardPct] = useState((defaults.cardFee || 0) * 100);
  const [ticket, setTicket] = useState(defaults.avgTicket || 0);
  const [hoursPerJob, setHoursPerJob] = useState(defaults.avgHours || 0);
  const [productiveHours, setProductiveHours] = useState(
    defaults.productiveHours || 0
  );

  const r = useMemo(() => {
    const tax = taxPct / 100;
    const card = cardPct / 100;
    const variable = variablePct / 100;
    const contribution = 1 - variable - tax - card;
    const invalid = contribution <= 0;

    const requiredRevenue = invalid ? 0 : (fixedCosts + goal) / contribution;
    const breakEven = invalid ? 0 : fixedCosts / contribution;

    const variableCost = requiredRevenue * variable;
    const taxes = requiredRevenue * tax;
    const cardFees = requiredRevenue * card;

    const jobs = ticket > 0 ? requiredRevenue / ticket : 0;
    const jobsRounded = Math.ceil(jobs);
    const jobsPerWeek = jobs / WEEKS;
    const hoursNeeded = hoursPerJob > 0 ? jobs * hoursPerJob : 0;
    const occupancy =
      productiveHours > 0 && hoursNeeded > 0 ? hoursNeeded / productiveHours : 0;
    const revenuePerWorkday = requiredRevenue / WORKDAYS;

    return {
      contribution,
      invalid,
      requiredRevenue,
      breakEven,
      variableCost,
      taxes,
      cardFees,
      jobs,
      jobsRounded,
      jobsPerWeek,
      hoursNeeded,
      occupancy,
      revenuePerWorkday,
    };
  }, [goal, fixedCosts, variablePct, taxPct, cardPct, ticket, hoursPerJob, productiveHours]);

  function handleSave() {
    startTransition(async () => {
      const res = await saveProlaboreGoal({
        prolabore_goal: goal,
        variable_cost_rate: variablePct / 100,
      });
      if (res.error) toast.error(res.error);
      else toast.success("Meta salva.");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Sua meta
            </CardTitle>
            <CardDescription>
              Quanto você quer receber de pró-labore (sua retirada) por mês.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="goal">Meta de pró-labore mensal (R$)</Label>
              <Input
                id="goal"
                type="number"
                step="100"
                min="0"
                value={goal || ""}
                onChange={(e) => setGoal(Number(e.target.value))}
                className="text-lg font-semibold"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Premissas do negócio</CardTitle>
            <CardDescription>
              Já preenchemos com seus dados de Custos & margem. Ajuste se quiser
              simular cenários.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fixed">Custos fixos mensais (R$)</Label>
              <Input
                id="fixed"
                type="number"
                step="50"
                min="0"
                value={fixedCosts || ""}
                onChange={(e) => setFixedCosts(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variable">
                Custo variável médio (% do preço)
              </Label>
              <Input
                id="variable"
                type="number"
                step="1"
                min="0"
                max="99"
                value={variablePct || ""}
                onChange={(e) => setVariablePct(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Materiais + mão de obra direta como % do preço de venda.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax">Impostos (%)</Label>
              <Input
                id="tax"
                type="number"
                step="0.01"
                min="0"
                value={taxPct || ""}
                onChange={(e) => setTaxPct(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card">Taxa de cartão (%)</Label>
              <Input
                id="card"
                type="number"
                step="0.01"
                min="0"
                value={cardPct || ""}
                onChange={(e) => setCardPct(Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Esforço por serviço</CardTitle>
            <CardDescription>
              Usado para estimar quantos serviços e horas você precisa. Sugerido
              pela média dos seus orçamentos.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ticket">Ticket médio (R$)</Label>
              <Input
                id="ticket"
                type="number"
                step="50"
                min="0"
                value={ticket || ""}
                onChange={(e) => setTicket(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hpj">Horas por serviço</Label>
              <Input
                id="hpj"
                type="number"
                step="0.5"
                min="0"
                value={hoursPerJob || ""}
                onChange={(e) => setHoursPerJob(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph">Horas produtivas/mês</Label>
              <Input
                id="ph"
                type="number"
                step="1"
                min="0"
                value={productiveHours || ""}
                onChange={(e) => setProductiveHours(Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Para bater a meta</CardTitle>
            <CardDescription>
              Margem de contribuição: {formatPercent(r.contribution)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {r.invalid ? (
              <p className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">
                A soma de custo variável + impostos + cartão precisa ser menor
                que 100%. Ajuste as premissas.
              </p>
            ) : (
              <>
                <div className="rounded-lg bg-primary p-4 text-primary-foreground">
                  <p className="text-xs opacity-80">
                    Faturamento necessário / mês
                  </p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(r.requiredRevenue)}
                  </p>
                  <p className="mt-1 text-xs opacity-80">
                    {formatCurrency(r.revenuePerWorkday)} por dia útil (~
                    {WORKDAYS} dias)
                  </p>
                </div>

                <div className="space-y-1.5 text-sm">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Como esse faturamento se divide
                  </p>
                  <Row label="Materiais + mão de obra" value={r.variableCost} muted />
                  <Row label="Impostos" value={r.taxes} muted />
                  <Row label="Taxa de cartão" value={r.cardFees} muted />
                  <Row label="Custos fixos" value={fixedCosts} muted />
                  <Separator className="my-1" />
                  <Row
                    label="Seu pró-labore"
                    value={goal}
                    className="text-emerald-600"
                    bold
                  />
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Esforço estimado
                  </p>

                  {ticket > 0 ? (
                    <div className="flex items-start gap-2">
                      <TrendingUp className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">
                          {r.jobsRounded} serviços / mês
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ~{r.jobsPerWeek.toFixed(1)} por semana (ticket de{" "}
                          {formatCurrency(ticket)})
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Informe o ticket médio para estimar a quantidade de
                      serviços.
                    </p>
                  )}

                  {r.hoursNeeded > 0 ? (
                    <div className="flex items-start gap-2">
                      <Clock className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">
                          {Math.round(r.hoursNeeded)} horas de trabalho / mês
                        </p>
                        {productiveHours > 0 ? (
                          <p
                            className={
                              r.occupancy > 1
                                ? "text-xs font-medium text-destructive"
                                : "text-xs text-muted-foreground"
                            }
                          >
                            {formatPercent(r.occupancy)} da sua capacidade (
                            {productiveHours}h/mês)
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">
                        Ponto de equilíbrio: {formatCurrency(r.breakEven)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Faturamento mínimo só para cobrir os custos (sem
                        pró-labore).
                      </p>
                    </div>
                  </div>

                  {r.occupancy > 1 ? (
                    <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p className="text-xs">
                        A meta exige mais horas do que a sua capacidade. Para
                        alcançá-la, aumente o preço/ticket, reduza custos ou
                        amplie a equipe.
                      </p>
                    </div>
                  ) : null}
                </div>

                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={pending}
                >
                  {pending ? "Salvando..." : "Salvar meta"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
  className,
}: {
  label: string;
  value: number;
  bold?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className={`${bold ? "font-bold" : "font-medium"} ${className ?? ""}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

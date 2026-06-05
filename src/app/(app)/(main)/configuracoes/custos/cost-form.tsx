"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveCostSettings, type CostActionState } from "./actions";
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
import { formatCurrency } from "@/lib/utils";
import type { FixedCostItem } from "@/lib/database.types";

const initialState: CostActionState = { error: null, success: false };

export function CostForm({
  initial,
}: {
  initial: {
    fixed_costs: FixedCostItem[];
    productive_hours: number;
    labor_hourly_rate: number;
    default_tax_rate: number;
    default_profit_margin: number;
    default_card_fee: number;
  };
}) {
  const [state, formAction, pending] = useActionState(
    saveCostSettings,
    initialState
  );
  const [rows, setRows] = useState<FixedCostItem[]>(
    initial.fixed_costs.length
      ? initial.fixed_costs
      : [{ name: "", amount: 0 }]
  );
  const [hours, setHours] = useState(initial.productive_hours || 0);

  useEffect(() => {
    if (state.success) toast.success("Configurações salvas com sucesso.");
    if (state.error) toast.error(state.error);
  }, [state]);

  const totalFixed = useMemo(
    () => rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0),
    [rows]
  );
  const perHour = hours > 0 ? totalFixed / hours : 0;

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Custos fixos mensais</CardTitle>
            <CardDescription>
              Aluguel, energia, água, internet, contador, pró-labore, etc. Eles
              são rateados por hora de trabalho.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.map((row, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  {i === 0 && <Label className="text-xs">Descrição</Label>}
                  <Input
                    name="fixed_name"
                    placeholder="Ex.: Aluguel"
                    value={row.name}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, j) =>
                          j === i ? { ...r, name: e.target.value } : r
                        )
                      )
                    }
                  />
                </div>
                <div className="w-36 space-y-1">
                  {i === 0 && <Label className="text-xs">Valor (R$)</Label>}
                  <Input
                    name="fixed_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={row.amount || ""}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, j) =>
                          j === i
                            ? { ...r, amount: Number(e.target.value) }
                            : r
                        )
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setRows((prev) =>
                      prev.length > 1
                        ? prev.filter((_, j) => j !== i)
                        : [{ name: "", amount: 0 }]
                    )
                  }
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setRows((prev) => [...prev, { name: "", amount: 0 }])
              }
            >
              <Plus className="h-4 w-4" /> Adicionar custo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mão de obra e capacidade</CardTitle>
            <CardDescription>
              Usados para ratear custos fixos e calcular o valor da mão de obra.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="productive_hours">
                Horas produtivas por mês
              </Label>
              <Input
                id="productive_hours"
                name="productive_hours"
                type="number"
                step="1"
                min="1"
                value={hours || ""}
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="labor_hourly_rate">
                Valor da hora de mão de obra (R$)
              </Label>
              <Input
                id="labor_hourly_rate"
                name="labor_hourly_rate"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initial.labor_hourly_rate || ""}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Percentuais padrão</CardTitle>
            <CardDescription>
              Valores sugeridos automaticamente em novos orçamentos (em %).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="default_tax_rate">Impostos (%)</Label>
              <Input
                id="default_tax_rate"
                name="default_tax_rate"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(initial.default_tax_rate * 100).toString()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_profit_margin">Margem de lucro (%)</Label>
              <Input
                id="default_profit_margin"
                name="default_profit_margin"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(
                  initial.default_profit_margin * 100
                ).toString()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_card_fee">Taxa de cartão (%)</Label>
              <Input
                id="default_card_fee"
                name="default_card_fee"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(initial.default_card_fee * 100).toString()}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Custos fixos/mês</span>
              <span className="font-semibold">{formatCurrency(totalFixed)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Horas/mês</span>
              <span className="font-semibold">{hours || 0} h</span>
            </div>
            <div className="rounded-lg bg-accent p-4">
              <p className="text-xs text-accent-foreground/80">
                Custo fixo por hora
              </p>
              <p className="text-2xl font-bold text-accent-foreground">
                {formatCurrency(perHour)}
              </p>
              <p className="mt-1 text-xs text-accent-foreground/70">
                Rateado em cada hora de serviço no orçamento.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Salvando..." : "Salvar configurações"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

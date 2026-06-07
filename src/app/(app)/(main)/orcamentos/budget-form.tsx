"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveBudget, type BudgetInput } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { computePricing, round2 } from "@/lib/pricing";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { SEGMENTS } from "@/lib/constants";
import {
  employeeHourlyCost,
  type Client,
  type Employee,
  type Material,
  type ProductType,
  type Segment,
} from "@/lib/database.types";

const MANUAL_VALUE = "__manual__";

export interface BudgetFormDefaults {
  laborHourlyRate: number;
  fixedCostPerHour: number;
  taxRate: number;
  profitMargin: number;
  cardFee: number;
}

export interface BudgetFormInitial {
  id: string;
  title: string;
  client_id: string | null;
  product_type_id: string | null;
  segment: Segment;
  notes: string | null;
  service_description: string | null;
  valid_until: string | null;
  fixed_cost: number;
  labor_hours: number;
  tax_rate: number;
  profit_margin: number;
  card_fee: number;
  materialLines: MaterialLineState[];
  extraLines: ExtraLineState[];
  assignments: AssignmentInitial[];
}

export interface AssignmentInitial {
  employee_id: string | null;
  name: string;
  hours: number;
  hourly_cost: number;
}

interface MaterialLineState {
  key: string;
  material_id: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
}

interface ExtraLineState {
  key: string;
  description: string;
  amount: number;
}

interface AssignmentLineState {
  key: string;
  employee_id: string | null;
  name: string;
  hours: number;
  hourly_cost: number;
}

let counter = 0;
const newKey = () => `k${Date.now()}_${counter++}`;

export function BudgetForm({
  clients,
  productTypes,
  materials,
  employees,
  defaults,
  initial,
}: {
  clients: Client[];
  productTypes: ProductType[];
  materials: Material[];
  employees: Employee[];
  defaults: BudgetFormDefaults;
  initial?: BudgetFormInitial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [clientId, setClientId] = useState(initial?.client_id ?? "");
  const [productTypeId, setProductTypeId] = useState(
    initial?.product_type_id ?? ""
  );
  const [segment, setSegment] = useState<Segment>(initial?.segment ?? "moveis");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [serviceDescription, setServiceDescription] = useState(
    initial?.service_description ?? ""
  );
  const [validUntil, setValidUntil] = useState(initial?.valid_until ?? "");

  const [fixedPerHour, setFixedPerHour] = useState(
    initial && initial.labor_hours > 0
      ? initial.fixed_cost / initial.labor_hours
      : defaults.fixedCostPerHour
  );

  const [assignmentLines, setAssignmentLines] = useState<AssignmentLineState[]>(
    initial?.assignments?.map((a) => ({
      key: newKey(),
      employee_id: a.employee_id,
      name: a.name,
      hours: a.hours,
      hourly_cost: a.hourly_cost,
    })) ?? []
  );

  const laborHours = assignmentLines.reduce((acc, l) => acc + (l.hours || 0), 0);
  const laborCost = assignmentLines.reduce(
    (acc, l) => acc + round2((l.hours || 0) * (l.hourly_cost || 0)),
    0
  );
  const effectiveRate = laborHours > 0 ? laborCost / laborHours : 0;

  function addAssignmentLine() {
    setAssignmentLines((prev) => [
      ...prev,
      { key: newKey(), employee_id: null, name: "", hours: 0, hourly_cost: 0 },
    ]);
  }

  function onSelectEmployee(key: string, value: string) {
    if (value === MANUAL_VALUE) {
      setAssignmentLines((prev) =>
        prev.map((l) =>
          l.key === key ? { ...l, employee_id: null, name: "" } : l
        )
      );
      return;
    }
    const emp = employees.find((e) => e.id === value);
    setAssignmentLines((prev) =>
      prev.map((l) =>
        l.key === key
          ? {
              ...l,
              employee_id: value,
              name: emp?.name ?? l.name,
              hourly_cost: emp ? round2(employeeHourlyCost(emp)) : l.hourly_cost,
            }
          : l
      )
    );
  }

  const [taxPct, setTaxPct] = useState(
    (initial?.tax_rate ?? defaults.taxRate) * 100
  );
  const [marginPct, setMarginPct] = useState(
    (initial?.profit_margin ?? defaults.profitMargin) * 100
  );
  const [cardPct, setCardPct] = useState(
    (initial?.card_fee ?? defaults.cardFee) * 100
  );

  const [materialLines, setMaterialLines] = useState<MaterialLineState[]>(
    initial?.materialLines ?? []
  );
  const [extraLines, setExtraLines] = useState<ExtraLineState[]>(
    initial?.extraLines ?? []
  );

  function addMaterialLine() {
    setMaterialLines((prev) => [
      ...prev,
      {
        key: newKey(),
        material_id: null,
        description: "",
        quantity: 1,
        unit: "un",
        unit_cost: 0,
      },
    ]);
  }

  function onSelectMaterial(key: string, materialId: string) {
    const mat = materials.find((m) => m.id === materialId);
    setMaterialLines((prev) =>
      prev.map((l) =>
        l.key === key
          ? {
              ...l,
              material_id: materialId,
              description: mat?.name ?? l.description,
              unit: mat?.unit ?? l.unit,
              unit_cost: mat ? Number(mat.unit_cost) : l.unit_cost,
            }
          : l
      )
    );
  }

  const pricing = useMemo(
    () =>
      computePricing({
        materials: materialLines.map((l) => ({
          quantity: l.quantity || 0,
          unitCost: l.unit_cost || 0,
        })),
        laborHours: laborHours || 0,
        laborHourlyRate: effectiveRate || 0,
        fixedCostPerHour: fixedPerHour || 0,
        extraCost: extraLines.reduce((acc, e) => acc + (e.amount || 0), 0),
        taxRate: taxPct / 100,
        profitMargin: marginPct / 100,
        cardFee: cardPct / 100,
      }),
    [materialLines, laborHours, effectiveRate, fixedPerHour, extraLines, taxPct, marginPct, cardPct]
  );

  function handleSave() {
    const payload: BudgetInput = {
      id: initial?.id,
      client_id: clientId || null,
      product_type_id: productTypeId || null,
      title,
      segment,
      notes,
      service_description: serviceDescription,
      valid_until: validUntil || null,
      fixed_cost_per_hour: fixedPerHour || 0,
      tax_rate: taxPct / 100,
      profit_margin: marginPct / 100,
      card_fee: cardPct / 100,
      assignments: assignmentLines
        .filter((l) => (l.hours || 0) > 0)
        .map((l) => ({
          employee_id: l.employee_id,
          name: l.name || "Mão de obra",
          hours: l.hours || 0,
          hourly_cost: l.hourly_cost || 0,
        })),
      items: [
        ...materialLines.map((l) => ({
          kind: "material" as const,
          material_id: l.material_id,
          description: l.description || "Material",
          quantity: l.quantity || 0,
          unit: l.unit,
          unit_cost: l.unit_cost || 0,
        })),
        ...extraLines.map((e) => ({
          kind: "extra" as const,
          description: e.description || "Extra",
          quantity: 1,
          unit: null,
          unit_cost: e.amount || 0,
        })),
      ],
    };

    startTransition(async () => {
      const res = await saveBudget(payload);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Orçamento salvo.");
        router.push(`/orcamentos/${res.id}`);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados do orçamento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Reforma de sofá 3 lugares"
              />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhum cliente
                    </div>
                  ) : (
                    clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Segmento</Label>
              <Select
                value={segment}
                onValueChange={(v) => setSegment(v as Segment)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENTS.filter((s) => s.value !== "ambos").map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={productTypeId} onValueChange={setProductTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes
                    .filter(
                      (p) => p.segment === segment || p.segment === "ambos"
                    )
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Válido até</Label>
              <Input
                id="valid_until"
                type="date"
                value={validUntil ?? ""}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matéria-prima</CardTitle>
            <CardDescription>
              Selecione do catálogo ou ajuste a quantidade e o custo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {materialLines.map((line) => (
              <div
                key={line.key}
                className="grid grid-cols-12 items-end gap-2 rounded-lg border p-3"
              >
                <div className="col-span-12 space-y-1 sm:col-span-5">
                  <Label className="text-xs">Material</Label>
                  <Select
                    value={line.material_id ?? ""}
                    onValueChange={(v) => onSelectMaterial(line.key, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} ({formatCurrency(Number(m.unit_cost))}/
                          {m.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4 space-y-1 sm:col-span-2">
                  <Label className="text-xs">Qtd ({line.unit})</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={line.quantity || ""}
                    onChange={(e) =>
                      setMaterialLines((prev) =>
                        prev.map((l) =>
                          l.key === line.key
                            ? { ...l, quantity: Number(e.target.value) }
                            : l
                        )
                      )
                    }
                  />
                </div>
                <div className="col-span-4 space-y-1 sm:col-span-2">
                  <Label className="text-xs">Custo unit.</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.unit_cost || ""}
                    onChange={(e) =>
                      setMaterialLines((prev) =>
                        prev.map((l) =>
                          l.key === line.key
                            ? { ...l, unit_cost: Number(e.target.value) }
                            : l
                        )
                      )
                    }
                  />
                </div>
                <div className="col-span-3 space-y-1 sm:col-span-2">
                  <Label className="text-xs">Subtotal</Label>
                  <div className="flex h-9 items-center text-sm font-medium">
                    {formatCurrency((line.quantity || 0) * (line.unit_cost || 0))}
                  </div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setMaterialLines((prev) =>
                        prev.filter((l) => l.key !== line.key)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMaterialLine}
            >
              <Plus className="h-4 w-4" /> Adicionar material
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execução / mão de obra</CardTitle>
            <CardDescription>
              Selecione quem vai executar e quantas horas serão gastas. O custo
              por hora vem do salário cadastrado em Minha Conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {employees.length === 0 ? (
              <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                Você ainda não cadastrou funcionários. Cadastre sua equipe em{" "}
                <span className="font-medium">Minha Conta → Minha Tapeçaria</span>{" "}
                ou adicione a mão de obra manualmente abaixo.
              </p>
            ) : null}

            {assignmentLines.map((line) => (
              <div
                key={line.key}
                className="grid grid-cols-12 items-end gap-2 rounded-lg border p-3"
              >
                <div className="col-span-12 space-y-1 sm:col-span-5">
                  <Label className="text-xs">Quem executa</Label>
                  <Select
                    value={line.employee_id ?? MANUAL_VALUE}
                    onValueChange={(v) => onSelectEmployee(line.key, v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name} ({formatCurrency(employeeHourlyCost(emp))}/h)
                        </SelectItem>
                      ))}
                      <SelectItem value={MANUAL_VALUE}>
                        Manual / sem cadastro
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {line.employee_id === null ? (
                    <Input
                      className="mt-1"
                      placeholder="Nome / descrição"
                      value={line.name}
                      onChange={(e) =>
                        setAssignmentLines((prev) =>
                          prev.map((l) =>
                            l.key === line.key
                              ? { ...l, name: e.target.value }
                              : l
                          )
                        )
                      }
                    />
                  ) : null}
                </div>
                <div className="col-span-4 space-y-1 sm:col-span-2">
                  <Label className="text-xs">Horas</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={line.hours || ""}
                    onChange={(e) =>
                      setAssignmentLines((prev) =>
                        prev.map((l) =>
                          l.key === line.key
                            ? { ...l, hours: Number(e.target.value) }
                            : l
                        )
                      )
                    }
                  />
                </div>
                <div className="col-span-4 space-y-1 sm:col-span-2">
                  <Label className="text-xs">Custo/hora</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.hourly_cost || ""}
                    onChange={(e) =>
                      setAssignmentLines((prev) =>
                        prev.map((l) =>
                          l.key === line.key
                            ? { ...l, hourly_cost: Number(e.target.value) }
                            : l
                        )
                      )
                    }
                  />
                </div>
                <div className="col-span-3 space-y-1 sm:col-span-2">
                  <Label className="text-xs">Subtotal</Label>
                  <div className="flex h-9 items-center text-sm font-medium">
                    {formatCurrency((line.hours || 0) * (line.hourly_cost || 0))}
                  </div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setAssignmentLines((prev) =>
                        prev.filter((l) => l.key !== line.key)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAssignmentLine}
              >
                <Plus className="h-4 w-4" /> Adicionar execução
              </Button>
              <div className="w-full space-y-1 sm:w-48">
                <Label htmlFor="fixed_per_hour" className="text-xs">
                  Custo fixo/hora (R$)
                </Label>
                <Input
                  id="fixed_per_hour"
                  type="number"
                  step="0.01"
                  min="0"
                  value={fixedPerHour || ""}
                  onChange={(e) => setFixedPerHour(Number(e.target.value))}
                />
              </div>
            </div>
            {laborHours > 0 ? (
              <p className="text-xs text-muted-foreground">
                Total: {laborHours}h de mão de obra ·{" "}
                {formatCurrency(laborCost)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custos extras</CardTitle>
            <CardDescription>
              Frete, terceirizados, peças avulsas, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {extraLines.map((line) => (
              <div key={line.key} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="Descrição"
                    value={line.description}
                    onChange={(e) =>
                      setExtraLines((prev) =>
                        prev.map((l) =>
                          l.key === line.key
                            ? { ...l, description: e.target.value }
                            : l
                        )
                      )
                    }
                  />
                </div>
                <div className="w-36 space-y-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={line.amount || ""}
                    onChange={(e) =>
                      setExtraLines((prev) =>
                        prev.map((l) =>
                          l.key === line.key
                            ? { ...l, amount: Number(e.target.value) }
                            : l
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
                    setExtraLines((prev) =>
                      prev.filter((l) => l.key !== line.key)
                    )
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setExtraLines((prev) => [
                  ...prev,
                  { key: newKey(), description: "", amount: 0 },
                ])
              }
            >
              <Plus className="h-4 w-4" /> Adicionar custo extra
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Descritivo do serviço</CardTitle>
            <CardDescription>
              Este é o texto que aparece no orçamento do cliente (junto com o
              valor final). Descreva o serviço a ser realizado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={5}
              value={serviceDescription ?? ""}
              onChange={(e) => setServiceDescription(e.target.value)}
              placeholder="Ex.: Reforma completa de sofá 3 lugares: troca de espuma do assento e encosto, novo tecido suede cinza, revisão da estrutura de madeira e reforço do percinta."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observações internas</CardTitle>
            <CardDescription>
              Anotações para uso interno (não aparecem no PDF do cliente).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              value={notes ?? ""}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Prazo, condições, lembretes..."
            />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Precificação</CardTitle>
            <CardDescription>
              Impostos, taxa e margem incidem sobre o preço de venda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Impostos %</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxPct || ""}
                  onChange={(e) => setTaxPct(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Margem %</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={marginPct || ""}
                  onChange={(e) => setMarginPct(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cartão %</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cardPct || ""}
                  onChange={(e) => setCardPct(Number(e.target.value))}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5 text-sm">
              <Row label="Matéria-prima" value={pricing.materialsCost} />
              <Row label="Mão de obra" value={pricing.laborCost} />
              <Row label="Custos fixos" value={pricing.fixedCost} />
              <Row label="Extras" value={pricing.extraCost} />
              <Separator className="my-1" />
              <Row label="Custo total" value={pricing.totalCost} bold />
            </div>

            <Separator />

            {pricing.invalid ? (
              <p className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">
                A soma de impostos + margem + cartão precisa ser menor que 100%.
              </p>
            ) : (
              <div className="space-y-1.5 text-sm">
                <Row label="Impostos" value={pricing.taxAmount} muted />
                <Row label="Taxa de cartão" value={pricing.cardFeeAmount} muted />
                <Row
                  label="Lucro líquido"
                  value={pricing.profitAmount}
                  className="text-emerald-600"
                />
              </div>
            )}

            <div className="rounded-lg bg-primary p-4 text-primary-foreground">
              <p className="text-xs opacity-80">Preço de venda</p>
              <p className="text-3xl font-bold">
                {pricing.invalid ? "—" : formatCurrency(pricing.salePrice)}
              </p>
              {!pricing.invalid && (
                <p className="mt-1 text-xs opacity-80">
                  Lucro de {formatPercent(pricing.profitPercentOfPrice)} sobre a
                  venda
                </p>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={pending || !title.trim()}
            >
              {pending ? "Salvando..." : "Salvar orçamento"}
            </Button>
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

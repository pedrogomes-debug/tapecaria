"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { saveEmployee, deleteEmployee } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  employeeHourlyCost,
  employeeMonthlyCost,
  type Employee,
} from "@/lib/database.types";

export function EmployeesManager({ employees }: { employees: Employee[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [pending, startTransition] = useTransition();
  const [contractType, setContractType] = useState<"clt" | "pj">("clt");

  function openFor(employee: Employee | null) {
    setEditing(employee);
    setContractType((employee?.contract_type as "clt" | "pj") ?? "clt");
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await saveEmployee(formData);
      if (res.error) toast.error(res.error);
      else {
        toast.success(editing ? "Funcionário atualizado." : "Funcionário adicionado.");
        setOpen(false);
        setEditing(null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remover este funcionário?")) return;
    startTransition(async () => {
      const res = await deleteEmployee(id);
      if (res.error) toast.error(res.error);
      else toast.success("Funcionário removido.");
    });
  }

  return (
    <CardContent className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openFor(null)}>
          <Plus className="h-4 w-4" /> Novo funcionário
        </Button>
      </div>

      {employees.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          <Users className="h-6 w-6" />
          Cadastre seus funcionários e o salário deles para calcular o custo de
          mão de obra por hora automaticamente nos orçamentos.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Salário</TableHead>
              <TableHead className="text-right">Custo total</TableHead>
              <TableHead className="text-right">Custo/hora</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <div className="font-medium">{e.name}</div>
                  {e.role ? (
                    <div className="text-xs text-muted-foreground">{e.role}</div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant={e.contract_type === "pj" ? "secondary" : "default"}>
                    {e.contract_type === "pj" ? "PJ" : "CLT"}
                  </Badge>
                  {e.contract_type !== "pj" && Number(e.charges_rate) > 0 ? (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      +{Math.round(Number(e.charges_rate) * 100)}% encargos
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(Number(e.monthly_salary))}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(employeeMonthlyCost(e))}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(employeeHourlyCost(e))}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openFor(e)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(e.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar funcionário" : "Novo funcionário"}
            </DialogTitle>
            <DialogDescription>
              No CLT, os encargos (carga tributária) entram no seu custo. No PJ,
              o custo é apenas o valor pago.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            {editing ? (
              <input type="hidden" name="id" value={editing.id} />
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="emp_name">Nome</Label>
                <Input
                  id="emp_name"
                  name="name"
                  defaultValue={editing?.name ?? ""}
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="emp_role">Função (opcional)</Label>
                <Input
                  id="emp_role"
                  name="role"
                  placeholder="Ex.: Costureira, Tapeceiro"
                  defaultValue={editing?.role ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp_contract">Tipo de contrato</Label>
                <Select
                  name="contract_type"
                  value={contractType}
                  onValueChange={(v) => setContractType(v as "clt" | "pj")}
                >
                  <SelectTrigger id="emp_contract">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clt">CLT</SelectItem>
                    <SelectItem value="pj">PJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {contractType === "clt" ? (
                <div className="space-y-2">
                  <Label htmlFor="emp_charges">Encargos (%)</Label>
                  <Input
                    id="emp_charges"
                    name="charges_rate"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Ex.: 68"
                    defaultValue={
                      editing && editing.contract_type !== "pj"
                        ? Math.round(Number(editing.charges_rate) * 100)
                        : 68
                    }
                  />
                </div>
              ) : (
                <div className="hidden sm:block" />
              )}
              <div className="space-y-2">
                <Label htmlFor="emp_salary">Salário mensal (R$)</Label>
                <Input
                  id="emp_salary"
                  name="monthly_salary"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.monthly_salary ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp_hours">Horas trabalhadas/mês</Label>
                <Input
                  id="emp_hours"
                  name="monthly_hours"
                  type="number"
                  step="1"
                  min="1"
                  defaultValue={editing?.monthly_hours ?? 220}
                />
              </div>
            </div>
            {contractType === "clt" ? (
              <p className="text-xs text-muted-foreground">
                Encargos comuns (INSS patronal, FGTS, 13º, férias, etc.) variam
                conforme o regime. Ajuste o percentual à sua realidade.
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </CardContent>
  );
}

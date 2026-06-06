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
import { CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { employeeHourlyCost, type Employee } from "@/lib/database.types";

export function EmployeesManager({ employees }: { employees: Employee[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [pending, startTransition] = useTransition();

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
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
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
              <TableHead className="text-right">Salário</TableHead>
              <TableHead className="text-right">Horas/mês</TableHead>
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
                <TableCell className="text-right">
                  {formatCurrency(Number(e.monthly_salary))}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {Number(e.monthly_hours)}h
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(employeeHourlyCost(e))}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(e);
                        setOpen(true);
                      }}
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
              O custo por hora é calculado dividindo o salário pelas horas
              trabalhadas no mês.
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

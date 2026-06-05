"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBudget } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BUDGET_STATUS_MAP } from "@/lib/constants";
import type { Budget, BudgetStatus } from "@/lib/database.types";

type BudgetRow = Pick<
  Budget,
  | "id"
  | "title"
  | "status"
  | "sale_price"
  | "total_cost"
  | "profit_amount"
  | "created_at"
> & { client_name: string | null };

export function BudgetsList({ budgets }: { budgets: BudgetRow[] }) {
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Remover este orçamento?")) return;
    startTransition(async () => {
      const res = await deleteBudget(id);
      if (res.error) toast.error(res.error);
      else toast.success("Orçamento removido.");
    });
  }

  if (budgets.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Nenhum orçamento ainda. Crie o primeiro para calcular o preço certo.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orçamento</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {budgets.map((b) => {
              const status = BUDGET_STATUS_MAP[b.status as BudgetStatus];
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">
                    <Link href={`/orcamentos/${b.id}`} className="hover:underline">
                      {b.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.client_name || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(Number(b.total_cost))}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(Number(b.sale_price))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(b.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/orcamentos/${b.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={pending}
                        onClick={() => handleDelete(b.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

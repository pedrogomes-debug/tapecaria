"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateBudgetStatus } from "../actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUDGET_STATUS } from "@/lib/constants";
import type { BudgetStatus } from "@/lib/database.types";

export function StatusControl({
  id,
  status,
}: {
  id: string;
  status: BudgetStatus;
}) {
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    startTransition(async () => {
      const res = await updateBudgetStatus(id, value as BudgetStatus);
      if (res.error) toast.error(res.error);
      else toast.success("Status atualizado.");
    });
  }

  return (
    <Select value={status} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {BUDGET_STATUS.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

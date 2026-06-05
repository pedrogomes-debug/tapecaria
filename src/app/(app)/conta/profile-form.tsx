"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateProfile, type ProfileResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEGMENTS } from "@/lib/constants";
import type { Segment } from "@/lib/database.types";

const initial: ProfileResult = { error: null, success: false };

export function ProfileForm({
  profile,
}: {
  profile: {
    company_name: string | null;
    owner_name: string | null;
    phone: string | null;
    tax_regime: string | null;
    segment: Segment;
  };
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initial);

  useEffect(() => {
    if (state.success) toast.success("Perfil atualizado.");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="owner_name">Seu nome</Label>
          <Input
            id="owner_name"
            name="owner_name"
            defaultValue={profile.owner_name ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company_name">Nome do ateliê</Label>
          <Input
            id="company_name"
            name="company_name"
            defaultValue={profile.company_name ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone / WhatsApp</Label>
          <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax_regime">Regime tributário</Label>
          <Input
            id="tax_regime"
            name="tax_regime"
            placeholder="Ex.: MEI, Simples Nacional"
            defaultValue={profile.tax_regime ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="segment">Segmento</Label>
          <Select name="segment" defaultValue={profile.segment}>
            <SelectTrigger id="segment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEGMENTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar perfil"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}

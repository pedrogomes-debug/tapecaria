"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: AuthState = { error: null };

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="text-2xl font-bold tracking-tight">Criar conta</h2>
        <p className="text-sm text-muted-foreground">
          Comece a precificar seu trabalho do jeito certo.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="owner_name">Seu nome</Label>
          <Input id="owner_name" name="owner_name" placeholder="Nome completo" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company_name">Nome do ateliê / empresa</Label>
          <Input id="company_name" name="company_name" placeholder="Ex.: Tapeçaria Silva" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="segment">Segmento</Label>
          <Select name="segment" defaultValue="ambos">
            <SelectTrigger id="segment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="moveis">Móveis</SelectItem>
              <SelectItem value="automotivo">Automotivo</SelectItem>
              <SelectItem value="ambos">Ambos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        {state.error ? (
          <p className="text-sm font-medium text-destructive">{state.error}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Criando..." : "Criar conta"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}

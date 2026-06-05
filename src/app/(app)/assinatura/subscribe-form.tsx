"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { subscribe } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function tokenizeCard(
  publicKey: string,
  card: {
    number: string;
    holder_name: string;
    exp_month: string;
    exp_year: string;
    cvv: string;
  }
): Promise<string> {
  const res = await fetch(
    `https://api.pagar.me/core/v5/tokens?appId=${encodeURIComponent(publicKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "card", card }),
    }
  );
  const data = await res.json();
  if (!res.ok || !data?.id) {
    throw new Error(data?.message || "Cartão inválido.");
  }
  return data.id as string;
}

export function SubscribeForm({
  publicKey,
  defaultName,
  defaultEmail,
}: {
  publicKey: string;
  defaultName: string;
  defaultEmail: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loadingToken, setLoadingToken] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    setLoadingToken(true);
    try {
      const token = await tokenizeCard(publicKey, {
        number: String(fd.get("number") || "").replace(/\s/g, ""),
        holder_name: String(fd.get("holder_name") || ""),
        exp_month: String(fd.get("exp_month") || ""),
        exp_year: String(fd.get("exp_year") || ""),
        cvv: String(fd.get("cvv") || ""),
      });
      setLoadingToken(false);

      startTransition(async () => {
        const res = await subscribe({
          cardToken: token,
          name: String(fd.get("name") || ""),
          email: String(fd.get("email") || ""),
          document: String(fd.get("document") || ""),
        });
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Assinatura ativada! Bem-vindo ao Tapecei.");
          router.push("/dashboard");
          router.refresh();
        }
      });
    } catch (err) {
      setLoadingToken(false);
      toast.error(err instanceof Error ? err.message : "Erro ao validar cartão.");
    }
  }

  const busy = pending || loadingToken;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input id="name" name="name" defaultValue={defaultName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="document">CPF / CNPJ</Label>
          <Input id="document" name="document" placeholder="Somente números" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="number">Número do cartão</Label>
        <Input
          id="number"
          name="number"
          inputMode="numeric"
          placeholder="0000 0000 0000 0000"
          autoComplete="cc-number"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="holder_name">Nome impresso no cartão</Label>
        <Input
          id="holder_name"
          name="holder_name"
          autoComplete="cc-name"
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="exp_month">Mês</Label>
          <Input
            id="exp_month"
            name="exp_month"
            placeholder="MM"
            inputMode="numeric"
            maxLength={2}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exp_year">Ano</Label>
          <Input
            id="exp_year"
            name="exp_year"
            placeholder="AA"
            inputMode="numeric"
            maxLength={2}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            name="cvv"
            placeholder="123"
            inputMode="numeric"
            maxLength={4}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Processando...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" /> Assinar agora
          </>
        )}
      </Button>
      <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
        <Lock className="h-3 w-3" /> Pagamento processado com segurança pelo
        Pagar.me. Não armazenamos os dados do cartão.
      </p>
    </form>
  );
}

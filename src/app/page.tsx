import Link from "next/link";
import {
  Scissors,
  Calculator,
  Users,
  Package,
  Receipt,
  TrendingUp,
  Car,
  Sofa,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const features = [
  {
    icon: Calculator,
    title: "Precificação inteligente",
    desc: "Calcule tecido, espuma, madeira, mão de obra, custos fixos e impostos com precisão.",
  },
  {
    icon: TrendingUp,
    title: "Margem de lucro real",
    desc: "Saiba exatamente quanto sobra em cada serviço usando markup sobre o preço de venda.",
  },
  {
    icon: Receipt,
    title: "Orçamentos profissionais",
    desc: "Do levantamento de materiais ao preço final, tudo organizado por cliente.",
  },
  {
    icon: Users,
    title: "CRM de clientes",
    desc: "Cadastro, histórico e dados do veículo para o segmento automotivo.",
  },
  {
    icon: Package,
    title: "Catálogo de matéria-prima",
    desc: "Tecidos, chapas, espumas, plumantes e aviamentos com custo por unidade.",
  },
  {
    icon: Sofa,
    title: "Móveis e automotivo",
    desc: "Cadeiras, sofás, cabeceiras, painéis, bancos, portas, tetos e carpetes.",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Scissors className="h-5 w-5 text-primary" />
            Tapecei
          </div>
          <nav className="flex items-center gap-2">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Ir para o painel</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button asChild>
                  <Link href="/cadastro">Começar agora</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container flex flex-col items-center gap-6 py-20 text-center md:py-28">
          <span className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
            Feito para tapeceiros de móveis e automotivo
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Calcule cada custo. Cobre o preço certo.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            O sistema que reúne matéria-prima, mão de obra, custos fixos,
            impostos e margem de lucro para você fechar orçamentos lucrativos
            sem chutar.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/cadastro">Criar minha conta</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="container">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Tudo que seu ateliê precisa
              </h2>
              <p className="mt-3 text-muted-foreground">
                Da matéria-prima ao preço final, em um único sistema.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border bg-card p-6 shadow-sm"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1 font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-20">
          <div className="flex flex-col items-center gap-6 rounded-2xl border bg-primary p-10 text-center text-primary-foreground md:p-16">
            <Car className="h-10 w-10" />
            <h2 className="max-w-2xl text-3xl font-bold">
              Hoje você cobra no chute. Amanhã, no Tapecei.
            </h2>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/cadastro">Quero começar</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          Tapecei · {new Date().getFullYear()} · feito para tapeceiros.
        </div>
      </footer>
    </div>
  );
}

# Tapecei — Gestão e precificação para tapeceiros

SaaS para tapeceiros de **móveis** e **automotivo** calcularem todos os custos
(matéria-prima, mão de obra, custos fixos rateados e impostos) e definirem o
preço de venda pela margem desejada, com CRM, orçamentos e assinatura
recorrente.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (Postgres + Auth + RLS) — isolamento de dados por usuário
- **Pagar.me** — assinatura recorrente (libera o acesso à plataforma)
- Deploy na **Vercel**

## Como o preço é calculado

Impostos, taxa de cartão e margem incidem sobre o **preço de venda** (não sobre
o custo). Por isso usamos o **markup divisor**:

```
preço = custoTotal / (1 - (impostos% + margem% + taxaCartão%))
```

Onde `custoTotal = matéria-prima + mão de obra + (horas × custo fixo por hora) + extras`.
O custo fixo por hora vem de `custos fixos mensais / horas produtivas no mês`.

A lógica está em [`src/lib/pricing.ts`](src/lib/pricing.ts) e tem testes em
[`src/lib/pricing.test.ts`](src/lib/pricing.test.ts) (`npm test`).

## Configuração

### 1. Dependências

```bash
npm install
```

### 2. Supabase

1. Crie um projeto em https://supabase.com.
2. No **SQL Editor**, rode os arquivos em ordem:
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   - [`supabase/migrations/0002_new_user.sql`](supabase/migrations/0002_new_user.sql)
3. Em **Authentication → Providers → Email**, para entrar direto após o
   cadastro, desative "Confirm email" (ou implemente o fluxo de confirmação).
4. Pegue em **Project Settings → API**: `Project URL`, `anon key` e
   `service_role key`.

O trigger `handle_new_user` cria automaticamente o perfil, as configurações de
custo, a assinatura e o catálogo inicial de produtos (móveis e automotivo) a
cada novo cadastro.

### 3. Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

PAGARME_SECRET_KEY=sk_...
NEXT_PUBLIC_PAGARME_PUBLIC_KEY=pk_...
PAGARME_WEBHOOK_SECRET=...
PAGARME_PLAN_ID=plan_...        # opcional (recorrência por plano)
PAGARME_PLAN_AMOUNT=4790        # valor mensal em centavos (R$ 47,90)

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Enquanto `PAGARME_SECRET_KEY` não estiver definido, a cobrança fica
> **desativada** e o sistema funciona liberado — ótimo para desenvolvimento.
> Ao definir a chave, o acesso passa a exigir assinatura ativa.

### 4. Pagar.me

1. Crie a conta em https://pagar.me e pegue as chaves (test/live).
2. (Opcional) Crie um **plano de assinatura** recorrente e use o `PAGARME_PLAN_ID`.
   Sem ele, a assinatura é criada com cobrança mensal de `PAGARME_PLAN_AMOUNT`.
3. Configure um **webhook** apontando para
   `https://SEU-DOMINIO/api/webhooks/pagarme` para os eventos de
   `subscription.*` e `charge.*`. Use `PAGARME_WEBHOOK_SECRET` como Basic Auth.

### 5. Rodar

```bash
npm run dev      # http://localhost:3000
npm test         # testes do motor de cálculo
npm run build    # build de produção
```

## Deploy na Vercel

1. Suba o código para um repositório (GitHub/GitLab/Bitbucket).
   - O Git não está instalado nesta máquina. Instale em
     https://git-scm.com/download/win e depois:
     ```bash
     git init
     git add .
     git commit -m "Tapecei: sistema de precificação para tapeceiros"
     git branch -M main
     git remote add origin <URL-do-repo>
     git push -u origin main
     ```
2. Em https://vercel.com, importe o repositório.
3. Em **Settings → Environment Variables**, adicione as mesmas variáveis do
   `.env.local`. Ajuste `NEXT_PUBLIC_APP_URL` para o domínio da Vercel.
4. Deploy. Atualize o webhook do Pagar.me para o domínio de produção.

## Funcionalidades

- Autenticação por e-mail/senha (Supabase Auth)
- Dashboard com indicadores (orçamentos, aprovados, faturamento, lucro, ticket médio)
- Orçamentos com cálculo ao vivo, status e versão para impressão/PDF
- CRM de clientes (com dados de veículo para automotivo)
- Catálogo de matéria-prima (tecido, madeira, chapa, espuma, plumante, aviamento)
- Catálogo de produtos (móveis e automotivo)
- Configuração de custos fixos, mão de obra, impostos e margem padrão
- Assinatura recorrente via Pagar.me com gate de acesso e webhook

## Estrutura

```
src/
  app/
    (auth)/            # login, cadastro
    (app)/             # área autenticada (shell + sidebar)
      (main)/          # rotas que exigem assinatura ativa
        dashboard, orcamentos, clientes, materiais, produtos, configuracoes
      assinatura/      # checkout Pagar.me (sem gate)
      conta/           # perfil + status da assinatura
    api/webhooks/pagarme/
  components/ui/        # componentes shadcn
  lib/                  # pricing, supabase, auth, pagarme, tipos
supabase/migrations/    # schema + RLS + provisionamento
```

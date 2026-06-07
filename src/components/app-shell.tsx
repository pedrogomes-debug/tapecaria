"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Settings,
  Sofa,
  Scissors,
  Menu,
  X,
  CreditCard,
  LogOut,
  UserCircle,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logout } from "@/app/(auth)/actions";

const nav = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/materiais", label: "Matéria-prima", icon: Package },
  { href: "/produtos", label: "Produtos", icon: Sofa },
  { href: "/metas", label: "Meta de pró-labore", icon: Target },
  { href: "/configuracoes/custos", label: "Custos & margem", icon: Settings },
];

const secondary = [
  { href: "/assinatura", label: "Assinatura", icon: CreditCard },
  { href: "/conta", label: "Minha conta", icon: UserCircle },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const renderItem = (item: (typeof nav)[number]) => {
    const active =
      pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {nav.map(renderItem)}
      <div className="my-2 h-px bg-border" />
      {secondary.map(renderItem)}
    </nav>
  );
}

export function AppShell({
  children,
  userLabel,
  userEmail,
}: {
  children: React.ReactNode;
  userLabel: string;
  userEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const initials = userLabel.slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-64 shrink-0 border-r bg-card print:!hidden lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b px-5 font-semibold">
          <Scissors className="h-5 w-5 text-primary" />
          Tapecei
        </div>
        <NavLinks />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b px-5 font-semibold">
              <span className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-primary" />
                Tapecei
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 print:hidden lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">
                  {userLabel}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col">
                <span>{userLabel}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {userEmail}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/conta">
                  <UserCircle className="h-4 w-4" /> Minha conta
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/assinatura">
                  <CreditCard className="h-4 w-4" /> Assinatura
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action={logout}>
                <button type="submit" className="w-full">
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

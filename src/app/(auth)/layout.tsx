import Link from "next/link";
import { Scissors } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <Scissors className="h-6 w-6" />
          Tapecei
        </Link>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight">
            Pare de cobrar no chute.
          </h1>
          <p className="max-w-md text-primary-foreground/80">
            Calcule cada custo do seu ateliê de tapeçaria, defina a margem e
            gere orçamentos profissionais para móveis e automotivo.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">
          Tecido, espuma, madeira, mão de obra, impostos e lucro em um só lugar.
        </p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

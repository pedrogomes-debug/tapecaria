import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name, owner_name")
    .eq("id", user.id)
    .maybeSingle();

  const userLabel =
    profile?.company_name ||
    profile?.owner_name ||
    user.email?.split("@")[0] ||
    "Minha conta";

  return (
    <AppShell userLabel={userLabel} userEmail={user.email ?? ""}>
      {children}
    </AppShell>
  );
}

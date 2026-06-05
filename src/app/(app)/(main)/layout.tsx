import { requireActiveSubscription } from "@/lib/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireActiveSubscription();
  return <>{children}</>;
}

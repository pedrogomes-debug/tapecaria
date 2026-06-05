import { requireUser } from "@/lib/auth";
import { getCostSettings } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { CostForm } from "./cost-form";

export default async function CustosPage() {
  const user = await requireUser();
  const settings = await getCostSettings(user.id);

  return (
    <div>
      <PageHeader
        title="Custos & margem"
        description="Configure os custos fixos da empresa, mão de obra, impostos e margem padrão."
      />
      <CostForm initial={settings} />
    </div>
  );
}

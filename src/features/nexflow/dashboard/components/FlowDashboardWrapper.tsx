import type { FlowCategory } from "@/types/nexflow";
import { SalesDashboard } from "./SalesDashboard";
import { OnboardingDashboard } from "./OnboardingDashboard";
import { GenericDashboard } from "./GenericDashboard";
import { cn } from "@/lib/utils";

interface FlowDashboardWrapperProps {
  flowId: string;
  category: FlowCategory | null;
  className?: string;
}

/**
 * Wrapper que aplica o Strategy Pattern: renderiza o dashboard adequado
 * conforme a categoria do flow (finance → vendas, onboarding → onboarding, generic → placeholder).
 */
export function FlowDashboardWrapper({
  flowId,
  category,
  className,
}: FlowDashboardWrapperProps) {
  if (category === "finance") {
    return <SalesDashboard flowId={flowId} className={className} />;
  }

  if (category === "onboarding") {
    return <OnboardingDashboard flowId={flowId} className={className} />;
  }

  return <GenericDashboard className={className} />;
}

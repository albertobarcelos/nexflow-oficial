import type { CreateCardInput } from "@/hooks/useNexflowCardsInfinite";
import type { StepFieldValueMap } from "@/types/nexflow";
import type { NewCardWizardResult } from "../components/NewCardWizard";

/**
 * Monta o payload de CreateCardInput a partir do resultado do wizard de novo card.
 * Usado em NexflowBoardPage.handleWizardSuccess e testável em unitários.
 */
export function buildCreateCardInputFromWizard(
  data: NewCardWizardResult,
  flowId: string,
  stepId: string
): CreateCardInput {
  const fieldValues: StepFieldValueMap = {};
  if (data.products.length > 0) {
    fieldValues.products = data.products as unknown as StepFieldValueMap["products"];
  }
  const firstProductItemId =
    data.products.length > 0 && data.products[0]?.itemId
      ? data.products[0].itemId
      : null;

  return {
    flowId,
    stepId,
    title: data.companyName || "Novo card",
    contactId: data.contactId,
    contactIds: data.contactIds,
    companyId: data.companyId,
    fieldValues: Object.keys(fieldValues).length > 0 ? fieldValues : undefined,
    product: firstProductItemId,
    value: data.value,
  };
}

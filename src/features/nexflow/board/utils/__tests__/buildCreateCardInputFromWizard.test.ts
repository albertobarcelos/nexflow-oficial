import { describe, it, expect } from "vitest";
import { buildCreateCardInputFromWizard } from "../buildCreateCardInputFromWizard";
import type { CardProduct } from "@/features/nexflow/card-details/types";

const flowId = "flow-1";
const stepId = "step-1";

describe("buildCreateCardInputFromWizard", () => {
  it("retorna title como companyName quando informado", () => {
    const data = {
      contactIds: ["c1"],
      contactId: "c1",
      companyId: "co1",
      companyName: "Empresa ABC",
      products: [] as CardProduct[],
      value: 0,
    };
    const result = buildCreateCardInputFromWizard(data, flowId, stepId);
    expect(result.title).toBe("Empresa ABC");
    expect(result.flowId).toBe(flowId);
    expect(result.stepId).toBe(stepId);
    expect(result.contactId).toBe("c1");
    expect(result.companyId).toBe("co1");
    expect(result.contactIds).toEqual(["c1"]);
    expect(result.value).toBe(0);
  });

  it("usa 'Novo card' quando companyName está vazio", () => {
    const data = {
      contactIds: ["c1"],
      contactId: "c1",
      companyId: "co1",
      companyName: "",
      products: [] as CardProduct[],
      value: 0,
    };
    const result = buildCreateCardInputFromWizard(data, flowId, stepId);
    expect(result.title).toBe("Novo card");
  });

  it("inclui fieldValues.products e product/value quando há produtos", () => {
    const products: CardProduct[] = [
      {
        id: "p1",
        itemId: "item-1",
        itemName: "Produto X",
        itemPrice: 100,
        modularFields: [],
        totalValue: 100,
        isModularEnabled: false,
      },
    ];
    const data = {
      contactIds: ["c1"],
      contactId: "c1",
      companyId: "co1",
      companyName: "Empresa",
      products,
      value: 100,
    };
    const result = buildCreateCardInputFromWizard(data, flowId, stepId);
    expect(result.fieldValues).toBeDefined();
    expect(result.fieldValues?.products).toEqual(products);
    expect(result.product).toBe("item-1");
    expect(result.value).toBe(100);
  });

  it("não inclui fieldValues quando products está vazio", () => {
    const data = {
      contactIds: ["c1"],
      contactId: "c1",
      companyId: null,
      companyName: "Empresa",
      products: [] as CardProduct[],
      value: 0,
    };
    const result = buildCreateCardInputFromWizard(data, flowId, stepId);
    expect(result.fieldValues).toBeUndefined();
    expect(result.product).toBeNull();
    expect(result.value).toBe(0);
  });
});

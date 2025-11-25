import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PropertiesPanel } from "../PropertiesPanel";
import type { NexflowStepField } from "@/types/nexflow";

const baseField: NexflowStepField = {
  id: "field-1",
  stepId: "step-1",
  label: "Campo Original",
  fieldType: "text",
  isRequired: false,
  position: 0,
  configuration: {},
  createdAt: new Date().toISOString(),
};

describe("PropertiesPanel", () => {
  it("apenas persiste label ao perder o foco", () => {
    const onFieldUpdate = vi.fn();
    render(
      <PropertiesPanel
        flowDraft={{ name: "Flow", description: "", isActive: true }}
        onFlowDraftChange={vi.fn()}
        selectedField={baseField}
        onFieldUpdate={onFieldUpdate}
        onFieldConfigurationUpdate={vi.fn()}
        onDuplicateField={vi.fn()}
        onDeleteField={vi.fn()}
      />
    );

    const labelInput = screen.getByPlaceholderText("Ex: Número do contrato");
    fireEvent.change(labelInput, { target: { value: "Novo título" } });
    expect(onFieldUpdate).not.toHaveBeenCalled();

    fireEvent.blur(labelInput, { target: { value: "Novo título" } });
    expect(onFieldUpdate).toHaveBeenCalledWith({
      id: baseField.id,
      label: "Novo título",
    });
  });

  it("atualiza configuração de placeholder apenas no blur", () => {
    const onConfigUpdate = vi.fn();
    render(
      <PropertiesPanel
        flowDraft={{ name: "Flow", description: "", isActive: true }}
        onFlowDraftChange={vi.fn()}
        selectedField={baseField}
        onFieldUpdate={vi.fn()}
        onFieldConfigurationUpdate={onConfigUpdate}
        onDuplicateField={vi.fn()}
        onDeleteField={vi.fn()}
      />
    );

    const placeholderInput = screen.getByPlaceholderText(
      "Texto auxiliar exibido no campo"
    );
    fireEvent.change(placeholderInput, { target: { value: "Digite aqui" } });
    expect(onConfigUpdate).not.toHaveBeenCalled();

    fireEvent.blur(placeholderInput, { target: { value: "Digite aqui" } });
    expect(onConfigUpdate).toHaveBeenCalled();
  });
});


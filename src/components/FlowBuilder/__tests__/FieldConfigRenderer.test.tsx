import { render, screen, fireEvent } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { FieldConfigRenderer } from "../FieldConfigRenderer";
import type { FieldFormValues } from "../types";
import type { ReactNode } from "react";

function renderChecklistConfig(onCommit = vi.fn()) {
  const Wrapper = ({
    children,
  }: {
    children: (methods: ReturnType<typeof useForm<FieldFormValues>>) => ReactNode;
  }) => {
    const methods = useForm<FieldFormValues>({
      defaultValues: {
        label: "",
        placeholder: "",
        isRequired: false,
        checklistItems: [{ value: "Primeira opção" }],
        validation: "none",
      },
    });
    return <FormProvider {...methods}>{children(methods)}</FormProvider>;
  };

  const utils = render(
    <Wrapper>
      {(methods) => (
        <FieldConfigRenderer
          fieldType="checklist"
          control={methods.control}
          register={methods.register}
          getValues={methods.getValues}
          setValue={methods.setValue}
          onCommit={onCommit}
        />
      )}
    </Wrapper>
  );

  return { ...utils, onCommit };
}

describe("FieldConfigRenderer", () => {
  it("adiciona novos itens ao checklist", () => {
    renderChecklistConfig();
    const addButton = screen.getByText("Adicionar");
    fireEvent.click(addButton);

    const inputs = screen.getAllByPlaceholderText(/Opção/i);
    expect(inputs).toHaveLength(2);
  });

  it("remove itens e dispara onCommit", () => {
    const onCommit = vi.fn();
    renderChecklistConfig(onCommit);

    const removeButtons = screen.getAllByLabelText(/Remover opção/i);
    fireEvent.click(removeButtons[removeButtons.length - 1]);

    expect(onCommit).toHaveBeenCalled();
  });
});


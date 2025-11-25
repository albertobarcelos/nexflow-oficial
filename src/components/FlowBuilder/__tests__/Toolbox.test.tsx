import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Toolbox } from "../Toolbox";
import { fieldLibrary } from "@/lib/flowBuilder/fieldLibrary";

describe("Toolbox", () => {
  it("chama onAdd com o primeiro item ao clicar em Novo Campo", () => {
    const handleAdd = vi.fn();
    render(<Toolbox definitions={fieldLibrary} onAdd={handleAdd} />);

    const newFieldButton = screen.getByText("Novo Campo");
    fireEvent.click(newFieldButton);

    expect(handleAdd).toHaveBeenCalledWith(fieldLibrary[0].id);
  });

  it("dispara callback ao clicar em um card de campo", () => {
    const handleAdd = vi.fn();
    const subset = fieldLibrary.slice(0, 2);
    render(<Toolbox definitions={subset} onAdd={handleAdd} />);

    fireEvent.click(screen.getByText(subset[1].label));

    expect(handleAdd).toHaveBeenCalledWith(subset[1].id);
  });
});


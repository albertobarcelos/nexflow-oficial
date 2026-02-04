import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompanyRelationsPage } from "../CompanyRelationsPage";
import { useClientAccessGuard } from "@/hooks/useClientAccessGuard";

vi.mock("@/lib/supabase", () => ({
  supabase: {},
}));
vi.mock("@/hooks/useClientAccessGuard");
vi.mock("@/components/crm/companies/CompanyRelationsTable", () => ({
  CompanyRelationsTable: () => <div data-testid="company-relations-table">Tabela</div>,
}));

describe("CompanyRelationsPage", () => {
  beforeEach(() => {
    vi.mocked(useClientAccessGuard).mockReset();
  });

  it("não exibe dados quando não tem acesso (hasAccess false); exibe mensagem de erro", () => {
    vi.mocked(useClientAccessGuard).mockReturnValue({
      hasAccess: false,
      accessError: "Cliente não definido",
      currentClient: null,
      userRole: null,
      isLoading: false,
    });

    render(<CompanyRelationsPage />);

    expect(screen.getByText(/Cliente não definido/i)).toBeInTheDocument();
    expect(screen.queryByTestId("company-relations-table")).not.toBeInTheDocument();
  });

  it("exibe conteúdo da página quando tem acesso (hasAccess true)", () => {
    vi.mocked(useClientAccessGuard).mockReturnValue({
      hasAccess: true,
      accessError: null,
      currentClient: { id: "c1", name: "Cliente A", companyName: "Cliente A" },
      userRole: "user",
      isLoading: false,
    });

    render(<CompanyRelationsPage />);

    expect(screen.getByRole("heading", { name: /Relações de Empresas/i })).toBeInTheDocument();
    expect(screen.getByTestId("company-relations-table")).toBeInTheDocument();
  });
});

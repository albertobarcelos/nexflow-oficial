import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormsManagementPage } from "../FormsManagementPage";
import { useClientAccessGuard } from "@/hooks/useClientAccessGuard";

vi.mock("@/lib/supabase", () => ({
  supabase: {},
  getCurrentClientId: vi.fn(),
}));
vi.mock("@/hooks/useClientAccessGuard");
vi.mock("@/hooks/usePublicContactForms", () => ({
  usePublicContactForms: () => ({
    forms: [],
    isLoading: false,
    error: null,
    createForm: { mutateAsync: vi.fn(), mutate: vi.fn() },
    updateForm: { mutateAsync: vi.fn(), mutate: vi.fn() },
    deleteForm: { mutateAsync: vi.fn(), mutate: vi.fn() },
    toggleActive: { mutateAsync: vi.fn(), mutate: vi.fn() },
  }),
}));
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

describe("FormsManagementPage", () => {
  beforeEach(() => {
    vi.mocked(useClientAccessGuard).mockReset();
  });

  it("não exibe conteúdo da página quando não tem acesso (hasAccess false); exibe mensagem de erro", () => {
    vi.mocked(useClientAccessGuard).mockReturnValue({
      hasAccess: false,
      accessError: "Cliente não definido",
      currentClient: null,
      userRole: null,
      isLoading: false,
    });

    render(<FormsManagementPage />);

    expect(
      screen.getByText(/Cliente não definido|não é possível acessar a gestão de formulários/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Gerenciar Formulários/i })
    ).not.toBeInTheDocument();
  });

  it("exibe conteúdo da página quando tem acesso (hasAccess true)", () => {
    vi.mocked(useClientAccessGuard).mockReturnValue({
      hasAccess: true,
      accessError: null,
      currentClient: { id: "c1", name: "Cliente A", companyName: "Cliente A" },
      userRole: "user",
      isLoading: false,
    });

    render(<FormsManagementPage />);

    expect(
      screen.getByRole("heading", { name: /Gerenciar Formulários/i })
    ).toBeInTheDocument();
  });
});

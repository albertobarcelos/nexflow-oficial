import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";
import { useCompanies } from "../useCompanies";
import { useClientStore } from "@/stores/clientStore";

const clientId = "client-1";
const mockCompany = {
  id: "company-1",
  name: "Empresa A",
  cnpj: "00.000.000/0001-00",
  razao_social: "Razão A",
  description: null,
  email: null,
  phone: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  client_id: clientId,
};

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock("@/stores/clientStore", () => ({
  useClientStore: vi.fn(),
}));

vi.mock("@/hooks/useSecureClientMutation", () => ({
  useSecureClientMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  invalidateClientQueries: vi.fn(),
}));

describe("useCompanies", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function wrapper({ children }: { children: ReactNode }) {
    return React.createElement(QueryClientProvider, {
      client: queryClient,
      children,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useClientStore).mockReturnValue({
      currentClient: {
        id: clientId,
        name: "Cliente 1",
        companyName: "Cliente 1",
      },
      availableClients: [],
      userRole: "user",
      isLoading: false,
      error: null,
      setCurrentClient: vi.fn(),
      loadClientContext: vi.fn(),
      clearContext: vi.fn(),
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockCompany],
            error: null,
          }),
        }),
      }),
    });
  });

  it("retorna objeto com companies, isLoading, createCompany e isCreating", () => {
    const { result } = renderHook(() => useCompanies(), { wrapper });
    expect(result.current).toHaveProperty("companies");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("createCompany");
    expect(result.current).toHaveProperty("isCreating");
    expect(typeof result.current.createCompany).toBe("function");
  });

  it("retorna apenas empresas do cliente após carregar (dados com client_id correto)", async () => {
    const { result } = renderHook(() => useCompanies(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.companies).toHaveLength(1);
    expect(result.current.companies[0]).toMatchObject({
      id: mockCompany.id,
      name: mockCompany.name,
      cnpj: mockCompany.cnpj,
      razao_social: mockCompany.razao_social,
    });
  });
});

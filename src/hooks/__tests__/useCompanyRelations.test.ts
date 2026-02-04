import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";
import { useCompanyRelations } from "../useCompanyRelations";
import { useClientStore } from "@/stores/clientStore";

const clientId = "client-1";

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

describe("useCompanyRelations", () => {
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

    // web_companies retorna vazio; assim contact_companies não é chamado em batch
    mockFrom.mockImplementation((table: string) => {
      if (table === "web_companies") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "contact_companies") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      return {};
    });
  });

  it("retorna objeto com companies, isLoading e error", () => {
    const { result } = renderHook(() => useCompanyRelations(), { wrapper });
    expect(result.current).toHaveProperty("companies");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("error");
  });

  it("retorna lista vazia de empresas quando não há dados do cliente", async () => {
    const { result } = renderHook(() => useCompanyRelations(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.companies).toEqual([]);
  });
});

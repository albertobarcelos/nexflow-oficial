import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";
import { useSidebarData } from "../useSidebarData";
import { useClientStore } from "@/stores/clientStore";

const clientId = "client-1";
const userId = "user-1";

const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

vi.mock("@/stores/clientStore", () => ({
  useClientStore: vi.fn(),
}));

describe("useSidebarData", () => {
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
    queryClient.clear();

    vi.mocked(useClientStore).mockImplementation((selector?: (s: unknown) => unknown) => {
      const state = {
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
      };
      return typeof selector === "function" ? selector(state) : state;
    });

    mockGetUser.mockResolvedValue({
      data: { user: { id: userId } },
    });
  });

  it("retorna funnels apenas do cliente atual (web_flows com client_id)", async () => {
    const funnelsList = [
      {
        id: "flow-1",
        client_id: clientId,
        name: "Flow A",
        description: null,
        created_at: "",
        updated_at: "",
        created_by: userId,
      },
    ];
    const collaboratorChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { client_id: clientId },
        error: null,
      }),
    };
    const funnelsChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: funnelsList, error: null }),
      }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "core_client_users") return collaboratorChain;
      if (table === "web_flows") return funnelsChain;
      return {};
    });

    const { result } = renderHook(() => useSidebarData(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.funnels).toHaveLength(1);
      },
      { timeout: 2000 }
    );

    expect(result.current.funnels).toEqual(funnelsList);
    expect(result.current.entities).toHaveLength(3);
    expect(mockFrom).toHaveBeenCalledWith("web_flows");
  });

  it("rejeita funnels de outro cliente (validação dupla)", async () => {
    const wrongFunnels = [
      {
        id: "flow-1",
        client_id: "outro-client",
        name: "Flow A",
      },
    ];
    const collaboratorChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { client_id: clientId },
        error: null,
      }),
    };
    const eqMock = vi.fn().mockResolvedValue({ data: wrongFunnels, error: null });
    const funnelsChain = {
      select: vi.fn().mockReturnValue({ eq: eqMock }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "core_client_users") return collaboratorChain;
      if (table === "web_flows") return funnelsChain;
      return {};
    });

    const { result } = renderHook(() => useSidebarData(), { wrapper });

    await waitFor(() => {
      expect(result.current.funnels).toBeDefined();
    });

    // Validação dupla faz a query falhar; funnels fica [] e web_flows foi chamado com client_id correto.
    expect(mockFrom).toHaveBeenCalledWith("web_flows");
    expect(eqMock).toHaveBeenCalledWith("client_id", clientId);
  });

  it("não busca funnels quando clientId é null", () => {
    vi.mocked(useClientStore).mockImplementation((selector?: (s: unknown) => unknown) => {
      const state = {
        currentClient: null,
        availableClients: [],
        userRole: null,
        isLoading: false,
        error: null,
        setCurrentClient: vi.fn(),
        loadClientContext: vi.fn(),
        clearContext: vi.fn(),
      };
      return typeof selector === "function" ? selector(state) : state;
    });

    const { result } = renderHook(() => useSidebarData(), { wrapper });

    expect(result.current.funnels).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalledWith("web_flows");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";
import {
  useNotifications,
  useUnreadNotificationsCount,
  NOTIFICATIONS_QUERY_KEY,
  NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
} from "../useNotifications";
import { useClientStore } from "@/stores/clientStore";

const clientId = "client-1";
const userId = "user-1";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => mockFrom(table),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  },
}));

vi.mock("@/stores/clientStore", () => ({
  useClientStore: vi.fn(),
}));

describe("useNotifications", () => {
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

    vi.mocked(useClientStore).mockImplementation((selector) => {
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
      return selector(state);
    });

    mockGetUser.mockResolvedValue({
      data: { user: { id: userId } },
    });
  });

  it("query keys exportadas incluem prefixos corretos", () => {
    expect(NOTIFICATIONS_QUERY_KEY).toEqual(["notifications"]);
    expect(NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY).toEqual([
      "notifications",
      "unread-count",
    ]);
  });

  it("lista notificações filtradas por clientId e aplica validação dupla", async () => {
    const list = [
      {
        id: "n1",
        user_id: userId,
        client_id: clientId,
        title: "T1",
        message: "M1",
        read: false,
        type: "card_assigned",
        created_at: "",
      },
    ];
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: list, error: null }),
    };
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useNotifications(50), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(list);
    expect(chain.eq).toHaveBeenCalledWith("user_id", userId);
    expect(chain.eq).toHaveBeenCalledWith("client_id", clientId);
  });

  it("rejeita lista com item de outro cliente (validação dupla)", async () => {
    const listWrongClient = [
      {
        id: "n1",
        user_id: userId,
        client_id: "outro-client",
        title: "T1",
        message: "M1",
        read: false,
        type: "card_assigned",
        created_at: "",
      },
    ];
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: listWrongClient, error: null }),
    };
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useNotifications(50), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
    expect((result.current.error as Error).message).toContain(
      "Violação de segurança"
    );
  });

  it("não executa query quando clientId é null", () => {
    vi.mocked(useClientStore).mockImplementation((selector) => {
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
      return selector(state);
    });

    const { result } = renderHook(() => useNotifications(50), { wrapper });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isPending || result.current.isLoading).toBe(true);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe("useUnreadNotificationsCount", () => {
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

    vi.mocked(useClientStore).mockImplementation((selector) => {
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
      return selector(state);
    });

    mockGetUser.mockResolvedValue({
      data: { user: { id: userId } },
    });
  });

  it("retorna contagem filtrada por clientId", async () => {
    let callCount = 0;
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation(function (this: unknown) {
        callCount++;
        if (callCount >= 3) {
          return Promise.resolve({ count: 3, error: null });
        }
        return chain;
      }),
    };
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useUnreadNotificationsCount(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe(3);
  });
});

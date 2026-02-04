import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
  NOTIFICATION_SETTINGS_QUERY_KEY,
} from "../useNotificationSettings";
import { useClientStore } from "@/stores/clientStore";

const clientId = "client-1";
const userId = "user-1";

const mockGetUser = vi.fn();
const mockNexflowFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
  },
  nexflowClient: () => ({
    from: (table: string) => mockNexflowFrom(table),
  }),
}));

vi.mock("@/stores/clientStore", () => ({
  useClientStore: vi.fn(),
}));

describe("useNotificationSettings", () => {
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

    mockGetUser.mockResolvedValue({
      data: { user: { id: userId } },
    });
  });

  it("queryKey inclui clientId (NOTIFICATION_SETTINGS_QUERY_KEY)", () => {
    expect(NOTIFICATION_SETTINGS_QUERY_KEY).toEqual(["notification-settings"]);
  });

  it("retorna apenas configurações do cliente quando clientId está no store", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "set-1",
          user_id: userId,
          client_id: clientId,
          notify_card_assigned: true,
          notify_mentions: true,
          email_notifications_enabled: false,
          notify_new_cards_in_stages: [],
        },
        error: null,
      }),
    };
    mockNexflowFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useNotificationSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.client_id).toBe(clientId);
    expect(mockNexflowFrom).toHaveBeenCalledWith("user_notification_settings");
    expect(chain.eq).toHaveBeenCalledWith("user_id", userId);
    expect(chain.eq).toHaveBeenCalledWith("client_id", clientId);
  });

  it("retorna null quando não existe registro (PGRST116)", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      }),
    };
    mockNexflowFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useNotificationSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it("não executa query quando clientId é null (enabled false)", () => {
    vi.mocked(useClientStore).mockReturnValue({
      currentClient: null,
      availableClients: [],
      userRole: null,
      isLoading: false,
      error: null,
      setCurrentClient: vi.fn(),
      loadClientContext: vi.fn(),
      clearContext: vi.fn(),
    });

    const { result } = renderHook(() => useNotificationSettings(), { wrapper });

    expect(result.current.isLoading || result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(mockNexflowFrom).not.toHaveBeenCalled();
  });
});

describe("useUpdateNotificationSettings", () => {
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

    mockGetUser.mockResolvedValue({
      data: { user: { id: userId } },
    });
  });

  it("mutation inclui client_id no payload (update path)", async () => {
    const updatePayload = vi.fn();
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
        .mockResolvedValueOnce({ data: { id: "existing-id" }, error: null })
        .mockResolvedValueOnce({
          data: {
            id: "existing-id",
            user_id: userId,
            client_id: clientId,
            notify_card_assigned: false,
            notify_mentions: true,
            email_notifications_enabled: false,
            notify_new_cards_in_stages: [],
          },
          error: null,
        }),
      update: vi.fn().mockImplementation((payload: unknown) => {
        updatePayload(payload);
        return {
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: "existing-id",
              user_id: userId,
              client_id: clientId,
              notify_card_assigned: false,
              notify_mentions: true,
              email_notifications_enabled: false,
              notify_new_cards_in_stages: [],
            },
            error: null,
          }),
        };
      }),
    };
    mockNexflowFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateNotificationSettings(), {
      wrapper,
    });

    result.current.mutate({
      notify_card_assigned: false,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(updatePayload).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: clientId,
        user_id: userId,
      })
    );
  });
});

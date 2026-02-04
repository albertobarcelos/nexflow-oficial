import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";
import { useAccountProfile } from "../useAccountProfile";
import { useClientStore } from "@/stores/clientStore";

const clientId = "client-1";
const userId = "user-1";

const mockGetUser = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
      getSession: () => mockGetSession(),
      onAuthStateChange: (_: unknown, cb: (e: string, s: { user: { id: string } } | null) => void) => {
        mockOnAuthStateChange(cb);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
    from: (table: string) => mockFrom(table),
    storage: {
      from: vi.fn().mockReturnValue({
        list: vi.fn().mockResolvedValue({ data: [] }),
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ publicUrl: "https://example.com/avatar.jpg" }),
        remove: vi.fn().mockResolvedValue(undefined),
      }),
    },
  },
}));

vi.mock("@/stores/clientStore", () => ({
  useClientStore: vi.fn(),
}));

describe("useAccountProfile", () => {
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

    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: userId } } },
    });
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId, email: "user@test.com" } },
    });
  });

  it("retorna user, isLoadingUser, updateUserProfile, changeUserPassword, uploadAvatar e lastUpdate", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: userId,
          client_id: clientId,
          name: "João",
          surname: "Silva",
          avatar_url: null,
          avatar_type: "toy_face",
          avatar_seed: "1|1",
          custom_avatar_url: null,
          core_clients: { name: "Org 1" },
        },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useAccountProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoadingUser).toBe(false);
    });

    expect(result.current).toHaveProperty("user");
    expect(result.current).toHaveProperty("isLoadingUser");
    expect(result.current).toHaveProperty("updateUserProfile");
    expect(result.current).toHaveProperty("changeUserPassword");
    expect(result.current).toHaveProperty("uploadAvatar");
    expect(result.current).toHaveProperty("lastUpdate");
  });

  it("retorna perfil do usuário atual com organizationId igual ao client_id do contexto", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: userId,
          client_id: clientId,
          name: "Maria",
          surname: "Santos",
          avatar_url: null,
          avatar_type: "toy_face",
          avatar_seed: "1|1",
          custom_avatar_url: null,
          core_clients: { name: "Minha Org" },
        },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useAccountProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    expect(result.current.user?.organizationId).toBe(clientId);
    expect(result.current.user?.name).toBe("Maria");
    expect(result.current.user?.surname).toBe("Santos");
    expect(result.current.user?.organizationName).toBe("Minha Org");
  });

  it("lança erro de segurança quando client_id do perfil não confere com o contexto", async () => {
    const otherClientId = "client-outro";
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: userId,
          client_id: otherClientId,
          name: "Outro",
          surname: "Cliente",
          avatar_url: null,
          avatar_type: "toy_face",
          avatar_seed: "1|1",
          custom_avatar_url: null,
          core_clients: { name: "Outra Org" },
        },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useAccountProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.profileError).not.toBeNull();
    });

    expect(result.current.profileError?.message).toContain("Violação de segurança");
    expect(result.current.user).toBeNull();
  });

  it("não executa query quando clientId está ausente (currentClient null)", async () => {
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

    const { result } = renderHook(() => useAccountProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });

    expect(mockFrom).not.toHaveBeenCalled();
  });
});

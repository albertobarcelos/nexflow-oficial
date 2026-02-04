import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";
import { usePublicContactForms } from "../usePublicContactForms";
import { useClientStore } from "@/stores/clientStore";

const clientId = "client-form-1";

const { mockFrom, mockAuthGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockAuthGetUser: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getUser: mockAuthGetUser,
    },
  },
}));

vi.mock("@/stores/clientStore", () => ({
  useClientStore: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("usePublicContactForms", () => {
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
        name: "Cliente Form",
        companyName: "Cliente Form",
      },
      availableClients: [],
      userRole: "administrator",
      isLoading: false,
      error: null,
      setCurrentClient: vi.fn(),
      loadClientContext: vi.fn(),
      clearContext: vi.fn(),
    });

    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    // Select: from().select("*").eq("client_id", clientId).order(...)
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockFrom.mockImplementation((table: string) => {
      if (table === "public_opportunity_forms") {
        return {
          select: mockSelect,
          eq: vi.fn().mockReturnThis(),
          order: mockOrder,
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: "form-1",
              client_id: clientId,
              title: "Form 1",
              slug: "form-1",
              token: "tok",
              fields_config: [],
              settings: {},
              form_type: "public",
              requires_auth: false,
            },
            error: null,
          }),
        };
      }
      return {};
    });
  });

  it("retorna objeto com forms, isLoading, error e mutações", () => {
    const { result } = renderHook(() => usePublicContactForms(), { wrapper });
    expect(result.current).toHaveProperty("forms");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("createForm");
    expect(result.current).toHaveProperty("updateForm");
    expect(result.current).toHaveProperty("deleteForm");
    expect(result.current).toHaveProperty("toggleActive");
  });

  it("retorna lista vazia de formulários quando não há dados do cliente", async () => {
    const { result } = renderHook(() => usePublicContactForms(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.forms).toEqual([]);
  });

  it("chama a query com client_id do store (select eq client_id)", async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockImplementation((table: string) => {
      if (table === "public_opportunity_forms") {
        return { select: mockSelect, eq: mockEq, order: mockOrder };
      }
      return {};
    });

    renderHook(() => usePublicContactForms(), { wrapper });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("public_opportunity_forms");
    });

    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEq).toHaveBeenCalledWith("client_id", clientId);
  });

  it("retorna formulários mapeados com form_type e requires_auth quando há dados", async () => {
    queryClient.clear();

    const formRow = {
      id: "f1",
      client_id: clientId,
      title: "Meu Form",
      slug: "meu-form",
      token: "t",
      fields_config: [],
      settings: {},
      is_active: true,
      form_type: "internal",
      requires_auth: true,
      created_at: "",
      updated_at: "",
    };

    const mockOrder = vi.fn().mockResolvedValue({
      data: [formRow],
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockFrom.mockImplementation((table: string) => {
      if (table === "public_opportunity_forms") {
        return {
          select: mockSelect,
          eq: mockEq,
          order: mockOrder,
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          single: vi.fn(),
        };
      }
      return {};
    });

    const { result } = renderHook(() => usePublicContactForms(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.forms).toHaveLength(1);
    expect(result.current.forms[0].client_id).toBe(clientId);
    expect(result.current.forms[0].form_type).toBe("internal");
    expect(result.current.forms[0].requires_auth).toBe(true);
  });
});

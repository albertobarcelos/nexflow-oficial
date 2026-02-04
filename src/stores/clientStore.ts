import { create } from "zustand";
import { getCurrentUserWithClient } from "@/lib/supabase";
import type { Database } from "@/types/database";

/** Contexto do cliente ativo persistido por aba (CAMADA 2 do guia multi-tenant) */
const STORAGE_KEY = "client_context";
const TTL_MS = 1000 * 60 * 60; // 1 hora

type CoreClientRow = Database["public"]["Tables"]["core_clients"]["Row"];

/** Cliente atual no contexto (id + nome para exibição) */
export interface CurrentClient {
  id: string;
  name: string;
  companyName: string;
}

type ClientContextStorage = {
  clientId: string;
  clientName: string;
  companyName: string;
  userRole: string | null;
  expiresAt: number;
};

function loadFromSession(): ClientContextStorage | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClientContextStorage;
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveToSession(ctx: ClientContextStorage): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    // ignorar falha de storage
  }
}

interface ClientState {
  /** Cliente atualmente selecionado (isolamento por tenant) */
  currentClient: CurrentClient | null;
  /** Lista de clientes disponíveis para o usuário (futuro: multi-cliente) */
  availableClients: CurrentClient[];
  /** Role do usuário no cliente atual */
  userRole: string | null;
  /** Carregando contexto do cliente */
  isLoading: boolean;
  /** Erro ao carregar contexto */
  error: string | null;
  /** Define o cliente atual e persiste no SessionStorage */
  setCurrentClient: (client: CurrentClient | null, userRole?: string | null) => void;
  /** Carrega o contexto do cliente a partir do Supabase (e opcionalmente do SessionStorage) */
  loadClientContext: () => Promise<void>;
  /** Limpa o contexto (ex.: logout ou troca de cliente) */
  clearContext: () => void;
}

export const useClientStore = create<ClientState>((set, get) => ({
  currentClient: null,
  availableClients: [],
  userRole: null,
  isLoading: true,
  error: null,

  setCurrentClient: (client, userRole = null) => {
    if (client) {
      const ctx: ClientContextStorage = {
        clientId: client.id,
        clientName: client.name,
        companyName: client.companyName,
        userRole,
        expiresAt: Date.now() + TTL_MS,
      };
      saveToSession(ctx);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    set({
      currentClient: client,
      userRole: userRole ?? get().userRole,
      error: null,
    });
  },

  loadClientContext: async () => {
    set({ isLoading: true, error: null });
    try {
      // Tentar cache por aba primeiro
      const cached = loadFromSession();
      if (cached) {
        set({
          currentClient: {
            id: cached.clientId,
            name: cached.clientName,
            companyName: cached.companyName,
          },
          userRole: cached.userRole,
          isLoading: false,
          error: null,
        });
        return;
      }

      const data = await getCurrentUserWithClient();
      if (!data?.client_id) {
        set({
          currentClient: null,
          availableClients: [],
          userRole: null,
          isLoading: false,
          error: "Usuário não vinculado a um cliente",
        });
        return;
      }

      const clientRow = data.core_clients as CoreClientRow | null;
      const clientId = data.client_id;
      const name = clientRow?.name ?? "Cliente";
      const companyName = clientRow?.company_name ?? name;
      const role = data.role ?? null;

      const currentClient: CurrentClient = {
        id: clientId,
        name,
        companyName,
      };

      const ctx: ClientContextStorage = {
        clientId,
        clientName: name,
        companyName,
        userRole: role,
        expiresAt: Date.now() + TTL_MS,
      };
      saveToSession(ctx);

      set({
        currentClient,
        availableClients: [currentClient],
        userRole: role,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar contexto do cliente";
      set({
        currentClient: null,
        availableClients: [],
        userRole: null,
        isLoading: false,
        error: message,
      });
    }
  },

  clearContext: () => {
    sessionStorage.removeItem(STORAGE_KEY);
    set({
      currentClient: null,
      availableClients: [],
      userRole: null,
      error: null,
    });
  },
}));

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Deal {
  id: string;
  title: string;
  company: string;
  value: string;
  status: string;
  pipeline: string;
  created_at: string;
  updated_at: string;
  partner?: {
    id: string;
    name: string;
    avatar_type?: string;
    avatar_seed?: string;
    custom_avatar_url?: string;
  };
}

interface DealInput {
  title: string;
  company: string;
  value: string;
  status: string;
  pipeline: string;
}

export function useDeals() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);

  const fetchDeals = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from("deals")
        .select(`
          *,
          partner:partner_id (
            id,
            name,
            avatar_type,
            avatar_seed,
            custom_avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setDeals(data || []);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error("Erro ao buscar negócios:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const addDeal = async (deal: DealInput) => {
    setLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const dealWithTimestamps = {
        ...deal,
        created_at: now,
        updated_at: now,
      };

      const { data, error: supabaseError } = await supabase
        .from("deals")
        .insert([dealWithTimestamps])
        .select()
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (!data) {
        throw new Error("Erro ao adicionar negócio: nenhum dado retornado");
      }

      setDeals((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error("Erro ao adicionar negócio:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateDeal = async (id: string, updates: Partial<DealInput>) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from("deals")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (!data) {
        throw new Error("Erro ao atualizar negócio: nenhum dado retornado");
      }

      setDeals((prev) =>
        prev.map((deal) => (deal.id === id ? data : deal))
      );
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error("Erro ao atualizar negócio:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteDeal = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: supabaseError } = await supabase
        .from("deals")
        .delete()
        .eq("id", id);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setDeals((prev) => prev.filter((deal) => deal.id !== id));
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error("Erro ao excluir negócio:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    deals,
    loading,
    error,
    fetchDeals,
    addDeal,
    updateDeal,
    deleteDeal,
  };
}

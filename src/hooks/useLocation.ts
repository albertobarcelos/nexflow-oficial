import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface State {
  id: string;
  name: string;
  uf: string;
}

export interface City {
  id: string;
  name: string;
  state_id: string;
}

export function useLocation() {
  // Buscar todos os estados
  const { data: states = [], isLoading: isLoadingStates } = useQuery({
    queryKey: ["states"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("web_states")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as State[];
    },
  });

  // Buscar todas as cidades
  const { data: cities = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("web_cities")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as City[];
    },
  });

  // AIDEV-NOTE: Função para buscar cidades por estado usando React Query
  const getCitiesByState = (stateId: string) => {
    return useQuery({
      queryKey: ["cities", stateId],
      queryFn: async () => {
        if (!stateId) return [];
        const { data, error } = await supabase
          .from("web_cities")
          .select("*")
          .eq("state_id", stateId)
          .order("name");

        if (error) throw error;
        return data as City[];
      },
      enabled: !!stateId,
    });
  };

  // AIDEV-NOTE: Função para buscar cidades por estado sem React Query (para uso em handlers)
  const fetchCitiesByStateId = async (stateId: string): Promise<City[]> => {
    if (!stateId) return [];
    const { data, error } = await supabase
      .from("web_cities")
      .select("*")
      .eq("state_id", stateId)
      .order("name");

    if (error) throw error;
    return data as City[];
  };

  // AIDEV-NOTE: Funções utilitárias para obter nomes por ID
  const getStateName = (stateId: string): string => {
    const state = states.find(s => s.id === stateId);
    return state?.name || "-";
  };

  const getCityName = (cityId: string): string => {
    const city = cities.find(c => c.id === cityId);
    return city?.name || "-";
  };

  return {
    states,
    cities,
    isLoadingStates,
    isLoadingCities,
    getCitiesByState,
    fetchCitiesByStateId,
    getStateName,
    getCityName,
  };
}
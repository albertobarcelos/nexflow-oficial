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
        .from("states")
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
        .from("cities")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as City[];
    },
  });

  return {
    states,
    cities,
    isLoadingStates,
    isLoadingCities,
  };
}
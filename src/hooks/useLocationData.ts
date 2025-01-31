import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface State {
  id: string;
  name: string;
  uf: string;
}

interface City {
  id: string;
  name: string;
  state_id: string;
}

export function useLocationData() {
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

  const getCitiesByState = async (stateId: string) => {
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .eq("state_id", stateId)
      .order("name");

    if (error) throw error;
    return data as City[];
  };

  return {
    states,
    isLoadingStates,
    getCitiesByState,
  };
} 

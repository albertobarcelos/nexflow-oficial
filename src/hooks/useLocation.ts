import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

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

// Função não-hook para buscar cidades
export async function fetchCitiesByStateId(stateId: string): Promise<City[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("state_id", stateId)
    .order("name");

  if (error) {
    throw error;
  }

  return data;
}

export function useLocation() {
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");

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

  // Buscar cidades quando o estado for selecionado
  const { data: cities = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ["cities", selectedStateId],
    queryFn: async () => {
      if (!selectedStateId) return [];
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("state_id", selectedStateId)
        .order("name");

      if (error) throw error;
      return data as City[];
    },
    enabled: !!selectedStateId,
  });

  // Função para buscar cidades diretamente (sem cache)
  const fetchCitiesByStateIdDirect = async (stateId: string): Promise<City[]> => {
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .eq("state_id", stateId)
      .order("name");

    if (error) throw error;
    return data as City[];
  };

  const getStateName = (stateId: string) => {
    const state = states.find(s => s.id === stateId);
    return state ? state.name : "-";
  };

  const getCityName = async (cityId: string) => {
    const { data, error } = await supabase
      .from("cities")
      .select("name")
      .eq("id", cityId)
      .single();

    if (error || !data) return "-";
    return data.name;
  };

  return {
    states,
    cities,
    isLoadingStates,
    isLoadingCities,
    selectedStateId,
    setSelectedStateId,
    selectedCityId,
    setSelectedCityId,
    getStateName,
    getCityName,
    fetchCitiesByStateId,
    fetchCitiesByStateIdDirect,
  };
}
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

interface State {
  id: string;
  name: string;
  uf: string;
}

interface City {
  id: string;
  name: string;
  state_id: string;
  latitude: number;
  longitude: number;
}

interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city_id: string;
  state_id: string;
}

export function useAddressFields() {
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [addressData, setAddressData] = useState<Partial<AddressData>>({});

  // Busca todos os estados
  const { data: states, isLoading: isLoadingStates } = useQuery<State[]>({
    queryKey: ["states"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("states")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    }
  });

  // Busca cidades do estado selecionado
  const { data: cities, isLoading: isLoadingCities } = useQuery<City[]>({
    queryKey: ["cities", selectedStateId],
    queryFn: async () => {
      if (!selectedStateId) return [];

      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("state_id", selectedStateId)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!selectedStateId
  });

  // Busca endereço pelo CEP usando a API ViaCEP
  const searchCep = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        throw new Error("CEP não encontrado");
      }

      // Busca o estado pelo UF
      const { data: stateData } = await supabase
        .from("states")
        .select("*")
        .eq("uf", data.uf)
        .single();

      if (stateData) {
        setSelectedStateId(stateData.id);

        // Busca a cidade pelo nome e estado
        const { data: cityData } = await supabase
          .from("cities")
          .select("*")
          .eq("state_id", stateData.id)
          .ilike("name", data.localidade)
          .single();

        setAddressData({
          cep: data.cep,
          street: data.logradouro,
          neighborhood: data.bairro,
          state_id: stateData.id,
          city_id: cityData?.id
        });
      }

      return data;
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      throw error;
    }
  };

  return {
    states,
    cities,
    isLoadingStates,
    isLoadingCities,
    selectedStateId,
    setSelectedStateId,
    addressData,
    setAddressData,
    searchCep
  };
} 

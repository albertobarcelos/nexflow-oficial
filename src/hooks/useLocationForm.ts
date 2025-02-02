import { useState, useMemo } from "react";
import { State, City } from "./useLocation";

export function useLocationForm() {
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [states, setStates] = useState<State[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);

  // Função para atualizar a lista de estados
  const updateStates = (newStates: State[]) => {
    setStates(newStates);
  };

  // Filtra as cidades com base no estado selecionado
  const filteredCities = useMemo(() => {
    if (!selectedStateId) return [];
    return allCities.filter(city => city.state_id === selectedStateId);
  }, [selectedStateId, allCities]);

  // Função para limpar a cidade selecionada quando trocar de estado
  const handleStateChange = (stateId: string) => {
    setSelectedStateId(stateId);
    setSelectedCityId(""); // Limpa a cidade selecionada
  };

  return {
    states,
    filteredCities,
    selectedStateId,
    selectedCityId,
    setSelectedCityId,
    updateStates,
    handleStateChange,
  };
}

import { supabase } from '@/lib/supabase';

// AIDEV-NOTE: Utilitário para buscar IDs de estado e cidade baseado em UF e nome do município
// Usado para converter dados da API de CNPJ para os IDs do banco de dados local

interface LocationIds {
  stateId: string | null;
  cityId: string | null;
}

export const findLocationIds = async (uf: string, municipio: string): Promise<LocationIds> => {
  try {
    // Buscar estado pela UF
    const { data: stateData, error: stateError } = await supabase
      .from('web_states')
      .select('id')
      .eq('uf', uf.toUpperCase())
      .single();

    if (stateError || !stateData) {
      console.warn(`Estado não encontrado para UF: ${uf}`);
      return { stateId: null, cityId: null };
    }

    // Buscar cidade pelo nome e state_id
    const { data: cityData, error: cityError } = await supabase
      .from('web_cities')
      .select('id')
      .eq('state_id', stateData.id)
      .ilike('name', municipio)
      .single();

    if (cityError || !cityData) {
      console.warn(`Cidade não encontrada: ${municipio} - ${uf}`);
      return { stateId: stateData.id, cityId: null };
    }

    return {
      stateId: stateData.id,
      cityId: cityData.id
    };
  } catch (error) {
    console.error('Erro ao buscar localização:', error);
    return { stateId: null, cityId: null };
  }
};
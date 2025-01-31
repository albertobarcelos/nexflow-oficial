import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config(); // Carrega as variáveis de ambiente do .env

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Supabase URL e chave anônima são necessárias');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGECity {
  id: number;
  nome: string;
  municipio: {
    id: number;
    microrregiao: {
      mesorregiao: {
        UF: {
          sigla: string;
        }
      }
    }
  }
}

async function fetchStates(): Promise<any[]> {
  const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
  const states = await response.json();
  
  return states.map((state: IBGEState) => ({
    name: state.nome,
    uf: state.sigla,
    ibge_code: state.id
  }));
}

async function fetchCities(): Promise<any[]> {
  const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
  const cities = await response.json();
  
  return cities.map((city: IBGECity) => ({
    name: city.nome,
    state_uf: city.municipio.microrregiao.mesorregiao.UF.sigla,
    ibge_code: city.id,
    // Coordenadas serão adicionadas depois via outro serviço se necessário
    latitude: 0,
    longitude: 0
  }));
}

async function importData() {
  try {
    console.log('Buscando dados do IBGE...');
    
    const states = await fetchStates();
    console.log(`${states.length} estados encontrados`);
    
    const cities = await fetchCities();
    console.log(`${cities.length} cidades encontradas`);

    console.log('Importando dados para o Supabase...');
    
    const { error } = await supabase.rpc('import_ibge_location', {
      states_data: states,
      cities_data: cities
    });

    if (error) {
      throw error;
    }

    console.log('Importação concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a importação:', error);
  }
}

// Executa a importação
importData(); 

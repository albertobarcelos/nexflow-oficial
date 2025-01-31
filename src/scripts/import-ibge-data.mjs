import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../../.env') }); // Carrega as variáveis de ambiente do .env

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Supabase URL e chave anônima são necessárias');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * @typedef {Object} IBGEState
 * @property {number} id
 * @property {string} sigla
 * @property {string} nome
 */

/**
 * @typedef {Object} IBGECity
 * @property {number} id
 * @property {string} nome
 * @property {Object} municipio
 */

async function fetchStates() {
  const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
  const states = await response.json();
  
  return states.map(state => ({
    name: state.nome,
    uf: state.sigla,
    ibge_code: state.id
  }));
}

async function fetchCityLocation(ibgeCode) {
  try {
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v2/malhas/${ibgeCode}/metadados`);
    const data = await response.json();
    
    if (data && data.centroide) {
      return {
        latitude: data.centroide.latitude,
        longitude: data.centroide.longitude
      };
    }
  } catch (error) {
    console.error(`Erro ao buscar coordenadas para cidade ${ibgeCode}:`, error);
  }
  
  return { latitude: 0, longitude: 0 };
}

async function fetchCities() {
  // Primeiro buscamos os estados para ter um mapa de UF por ID
  const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
  const states = await response.json();
  const stateMap = new Map(states.map(state => [state.id, state.sigla]));

  // Agora buscamos as cidades
  const citiesResponse = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
  const cities = await citiesResponse.json();
  
  console.log('Buscando coordenadas das cidades...');
  const totalCities = cities.length;
  let processedCities = 0;

  const citiesWithCoordinates = await Promise.all(
    cities.map(async (city) => {
      const { latitude, longitude } = await fetchCityLocation(city.id);
      processedCities++;
      
      if (processedCities % 100 === 0) {
        console.log(`Progresso: ${processedCities}/${totalCities} cidades processadas`);
      }

      return {
        name: city.nome,
        state_uf: stateMap.get(city.microrregiao.mesorregiao.UF.id),
        ibge_code: city.id,
        latitude,
        longitude
      };
    })
  );

  return citiesWithCoordinates.filter(city => city.state_uf);
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
    if (error.response) {
      const text = await error.response.text();
      console.error('Detalhes do erro:', text);
    }
  }
}

// Executa a importação
importData(); 
// AIDEV-NOTE: Hook para consulta de CEP usando a API ViaCEP

import { useState } from 'react';
import { toast } from 'sonner';

interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

interface UseCepApiReturn {
  isLoading: boolean;
  consultarCep: (cep: string) => Promise<CepData | null>;
}

export const useCepApi = (): UseCepApiReturn => {
  const [isLoading, setIsLoading] = useState(false);

  const consultarCep = async (cep: string): Promise<CepData | null> => {
    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');
    
    // Valida se o CEP tem 8 dígitos
    if (cleanCep.length !== 8) {
      toast.error('CEP deve ter 8 dígitos');
      return null;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro na consulta do CEP');
      }
      
      const data: CepData = await response.json();
      
      // Verifica se o CEP foi encontrado
      if ('erro' in data) {
        toast.error('CEP não encontrado');
        return null;
      }
      
      toast.success('CEP consultado com sucesso!');
      return data;
      
    } catch (error) {
      console.error('Erro ao consultar CEP:', error);
      toast.error('Erro ao consultar CEP. Tente novamente.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    consultarCep
  };
};
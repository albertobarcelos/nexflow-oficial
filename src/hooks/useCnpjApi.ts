import { useState } from 'react';
import { toast } from 'sonner';

// AIDEV-NOTE: Hook para consulta de CNPJ usando API da ReceitaWS
// Preenche automaticamente dados da empresa ao consultar CNPJ válido
// Inclui tratamento de erros e feedback visual para o usuário

interface CnpjData {
  cnpj: string;
  nome: string;
  fantasia?: string;
  situacao: string;
  tipo: string;
  porte: string;
  natureza_juridica: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  email?: string;
  telefone?: string;
  data_situacao: string;
  data_inicio_atividade?: string;
  cnae_fiscal: string;
  cnae_fiscal_descricao: string;
  capital_social: string;
  qsa?: Array<{
    nome: string;
    qual: string;
    pais_origem?: string;
    nome_rep_legal?: string;
    qual_rep_legal?: string;
  }>;
}

interface UseCnpjApiReturn {
  consultarCnpj: (cnpj: string) => Promise<CnpjData | null>;
  isLoading: boolean;
  error: string | null;
}

export const useCnpjApi = (): UseCnpjApiReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCnpjForApi = (cnpj: string): string => {
    return cnpj.replace(/\D/g, '');
  };

  const validateCnpj = (cnpj: string): boolean => {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    if (cleanCnpj.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleanCnpj)) return false;
    
    // Validação do primeiro dígito verificador
    let soma = 0;
    let peso = 5;
    
    for (let i = 0; i < 12; i++) {
      soma += parseInt(cleanCnpj.charAt(i)) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    
    let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    
    if (parseInt(cleanCnpj.charAt(12)) !== digito1) return false;
    
    // Validação do segundo dígito verificador
    soma = 0;
    peso = 6;
    
    for (let i = 0; i < 13; i++) {
      soma += parseInt(cleanCnpj.charAt(i)) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    
    let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    
    return parseInt(cleanCnpj.charAt(13)) === digito2;
  };

  const consultarCnpj = async (cnpj: string): Promise<CnpjData | null> => {
    const cleanCnpj = formatCnpjForApi(cnpj);
    
    if (!validateCnpj(cleanCnpj)) {
      setError('CNPJ inválido');
      toast.error('CNPJ inválido');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Lista de APIs para tentar em ordem de prioridade
      const apis = [
        {
          name: 'BrasilAPI',
          url: `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`,
          adapter: (data: any): CnpjData => ({
            cnpj: data.cnpj,
            nome: data.razao_social || data.nome || '',
            fantasia: data.nome_fantasia || '',
            situacao: data.descricao_situacao_cadastral || '',
            tipo: data.descricao_tipo_logradouro || '',
            porte: data.porte || '',
            natureza_juridica: data.natureza_juridica || '',
            logradouro: data.logradouro || '',
            numero: data.numero || '',
            complemento: data.complemento || '',
            bairro: data.bairro || '',
            municipio: data.municipio || '',
            uf: data.uf || '',
            cep: data.cep || '',
            email: data.email || '',
            telefone: data.telefone || '',
            data_situacao: data.data_situacao_cadastral || '',
            data_inicio_atividade: data.data_inicio_atividade || '',
            cnae_fiscal: data.cnae_fiscal_principal?.codigo || '',
            cnae_fiscal_descricao: data.cnae_fiscal_principal?.descricao || '',
            capital_social: data.capital_social || '',
            qsa: data.qsa?.map((socio: any) => ({
              nome: socio.nome_socio || '',
              qual: socio.qualificacao_socio || '',
              pais_origem: socio.pais_origem || '',
              nome_rep_legal: socio.nome_representante_legal || '',
              qual_rep_legal: socio.qualificacao_representante_legal || '',
            })) || []
          })
        },
        {
          name: 'ReceitaWS',
          url: `https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`,
          adapter: (data: any): CnpjData => data
        },
        {
          name: 'CNPJ.ws',
          url: `https://www.cnpj.ws/cnpj/${cleanCnpj}`,
          adapter: (data: any): CnpjData => ({
            cnpj: data.cnpj || '',
            nome: data.razao_social || data.nome || '',
            fantasia: data.nome_fantasia || '',
            situacao: data.situacao || '',
            tipo: data.tipo || '',
            porte: data.porte || '',
            natureza_juridica: data.natureza_juridica || '',
            logradouro: data.logradouro || '',
            numero: data.numero || '',
            complemento: data.complemento || '',
            bairro: data.bairro || '',
            municipio: data.municipio || '',
            uf: data.uf || '',
            cep: data.cep || '',
            email: data.email || '',
            telefone: data.telefone || '',
            data_situacao: data.data_situacao || '',
            data_inicio_atividade: data.data_inicio_atividade || '',
            cnae_fiscal: data.cnae_fiscal || '',
            cnae_fiscal_descricao: data.cnae_fiscal_descricao || '',
            capital_social: data.capital_social || '',
            qsa: data.qsa || []
          })
        }
      ];

      for (const api of apis) {
        try {
          console.log(`Tentando consultar CNPJ via ${api.name}...`);
          
          const response = await fetch(api.url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            mode: 'cors',
          });
          
          if (!response.ok) {
            console.warn(`${api.name} retornou status ${response.status}`);
            continue;
          }

          const data = await response.json();
          
          // Verificar se a resposta contém erro
          if (data.status === 'ERROR' || data.message || data.error) {
            console.warn(`${api.name} retornou erro:`, data.message || data.error);
            continue;
          }

          // Verificar se os dados essenciais estão presentes
          if (!data.cnpj && !data.razao_social && !data.nome) {
            console.warn(`${api.name} retornou dados incompletos`);
            continue;
          }
          
          const adaptedData = api.adapter(data);
          console.log(`Sucesso ao consultar via ${api.name}`);
          toast.success(`Dados da empresa encontrados via ${api.name}!`);
          return adaptedData;
          
        } catch (err) {
          console.warn(`Erro ao consultar via ${api.name}:`, err);
          continue;
        }
      }

      // Se chegou até aqui, todas as APIs falharam
      const errorMessage = 'Não foi possível consultar o CNPJ. Verifique sua conexão com a internet ou tente novamente mais tarde.';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    consultarCnpj,
    isLoading,
    error
  };
};
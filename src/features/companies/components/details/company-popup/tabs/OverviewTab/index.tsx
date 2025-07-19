// AIDEV-NOTE: Componente principal da aba Visão Geral com seções organizadas

import { TabProps } from "../../types";
import { EditableField } from "../../components/EditableField";
import { useUpdateCompany, useStates, useCities, useUsers } from "../../hooks/index";
import { useCepApi } from "@/hooks/useCepApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";

/**
 * Componente que exibe a aba de Visão Geral da empresa
 */
const OverviewTab = ({ company }: TabProps) => {
  const [selectedStateId, setSelectedStateId] = useState<string | null>(company?.state_id || null);
  const updateCompany = useUpdateCompany(company?.id || '');
  const { consultarCep } = useCepApi();
  const { data: states = [] } = useStates();
  const { data: cities = [] } = useCities(selectedStateId);
  const { data: users = [] } = useUsers();

  useEffect(() => {
    setSelectedStateId(company?.state_id || null);
  }, [company?.state_id]);

  if (!company) return null;

  const categoriaOptions = [
    { value: 'Cliente em Potencial', label: 'Cliente em Potencial' },
    { value: 'Cliente Ativo', label: 'Cliente Ativo' },
    { value: 'Parceiro', label: 'Parceiro' },
    { value: 'Cliente Inativo', label: 'Cliente Inativo' },
    { value: 'Outro', label: 'Outro' }
  ];

  const stateOptions = states.map(state => ({
    value: state.id,
    label: `${state.name} (${state.uf})`
  }));

  const cityOptions = cities.map(city => ({
    value: city.id,
    label: city.name
  }));

  const userOptions = users.map(user => ({
    value: user.id,
    label: user.name
  }));

  const handleFieldSave = async (field: string, value: string) => {
    await updateCompany.mutateAsync({ [field]: value });
  };

  const handleCepSave = async (cep: string) => {
    const cepData = await consultarCep(cep);
    if (cepData) {
      // Buscar estado pelo UF
      const state = states.find(s => s.uf === cepData.uf);
      if (state) {
        setSelectedStateId(state.id);
        // Buscar cidade pelo nome
        const { data: stateCities } = await useCities(state.id);
        const city = stateCities?.find(c => c.name === cepData.localidade);
        
        await updateCompany.mutateAsync({
          cep: cepData.cep,
          rua: cepData.logradouro,
          bairro: cepData.bairro,
          state_id: state.id,
          city_id: city?.id || null
        });
      }
    } else {
      await updateCompany.mutateAsync({ cep });
    }
  };

  const handleStateChange = async (stateId: string) => {
    setSelectedStateId(stateId);
    await updateCompany.mutateAsync({ 
      state_id: stateId,
      city_id: null // Reset city when state changes
    });
  };

  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return 'Email inválido';
    }
    return null;
  };

  return (
    <div className="space-y-6 py-4">
      {/* 1️⃣ Dados Básicos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Dados Básicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditableField
              label="Nome da Empresa"
              value={company.name}
              placeholder="Digite o nome da empresa"
              required
              onSave={(value) => handleFieldSave('name', value)}
            />
            
            <EditableField
              label="CNPJ"
              value={company.cnpj}
              placeholder="00.000.000/0000-00"
              mask="cnpj"
              onSave={(value) => handleFieldSave('cnpj', value)}
            />
            
            <EditableField
              label="Razão Social"
              value={company.razao_social}
              placeholder="Digite a razão social"
              onSave={(value) => handleFieldSave('razao_social', value)}
            />
            
            <EditableField
              label="Categoria"
              value={company.categoria}
              type="select"
              options={categoriaOptions}
              placeholder="Selecione uma categoria"
              onSave={(value) => handleFieldSave('categoria', value)}
            />
            
            <EditableField
              label="Origem"
              value={company.origem}
              placeholder="Ex: Google, Campanha, Evento, Indicação"
              onSave={(value) => handleFieldSave('origem', value)}
            />
            
            <EditableField
              label="Responsável"
              value={company.creator_id}
              type="combobox"
              options={userOptions}
              placeholder="Selecione um responsável"
              onSave={(value) => handleFieldSave('creator_id', value)}
            />
            
            <EditableField
              label="Setor"
              value={company.setor}
              placeholder="Ex: Tecnologia, Varejo, Serviços"
              onSave={(value) => handleFieldSave('setor', value)}
            />
          </div>
          
          <EditableField
            label="Descrição"
            value={company.description}
            type="textarea"
            placeholder="Descrição da empresa..."
            onSave={(value) => handleFieldSave('description', value)}
          />
        </CardContent>
      </Card>

      {/* 2️⃣ Informações para Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Informações para Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditableField
              label="E-mail"
              value={company.email}
              type="email"
              placeholder="empresa@exemplo.com"
              validation={validateEmail}
              onSave={(value) => handleFieldSave('email', value)}
            />
            
            <EditableField
              label="WhatsApp / Celular"
              value={company.whatsapp || company.celular}
              type="tel"
              placeholder="(11) 99999-9999"
              mask="phone"
              onSave={(value) => handleFieldSave('whatsapp', value)}
            />
            
            <EditableField
              label="Telefone"
              value={company.telefone || company.phone}
              type="tel"
              placeholder="(11) 99999-9999"
              mask="phone"
              onSave={(value) => handleFieldSave('telefone', value)}
            />
            
            <EditableField
              label="Website"
              value={company.website}
              placeholder="https://www.exemplo.com"
              onSave={(value) => handleFieldSave('website', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 3️⃣ Dados do Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Dados do Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditableField
              label="CEP"
              value={company.cep}
              placeholder="00000-000"
              mask="cep"
              onSave={handleCepSave}
            />
            
            <EditableField
              label="Estado (UF)"
              value={company.state_id}
              type="combobox"
              options={stateOptions}
              placeholder="Selecione o estado"
              onSave={handleStateChange}
            />
            
            <EditableField
              label="Cidade"
              value={company.city_id}
              type="combobox"
              options={cityOptions}
              placeholder="Selecione a cidade"
              onSave={(value) => handleFieldSave('city_id', value)}
            />
            
            <EditableField
              label="Bairro"
              value={company.bairro}
              placeholder="Digite o bairro"
              onSave={(value) => handleFieldSave('bairro', value)}
            />
            
            <EditableField
              label="Rua"
              value={company.rua}
              placeholder="Digite o nome da rua"
              onSave={(value) => handleFieldSave('rua', value)}
            />
            
            <EditableField
              label="Número"
              value={company.numero}
              placeholder="Digite o número"
              onSave={(value) => handleFieldSave('numero', value)}
            />
          </div>
          
          <EditableField
            label="Complemento"
            value={company.complemento}
            placeholder="Apartamento, sala, andar..."
            onSave={(value) => handleFieldSave('complemento', value)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
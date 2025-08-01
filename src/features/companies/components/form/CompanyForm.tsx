import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCompanyForm } from '../../application/useCompanyForm';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from 'lucide-react';
import type { Company } from '../../types';
import { companySchema, CompanyFormValues } from '../../validation';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Partner } from '@/types/database/partner';
import { Person } from '@/types/database/person';
import { Home, Plus, Users, X, ChevronDown, AtSign } from 'lucide-react';
import { LinkPersonDialog } from '../related/LinkPersonDialog';
import { LinkPartnerDialog } from '../related/LinkPartnerDialog';
import { useCompanyRelationships } from '../../hooks/useCompanyRelationships';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCompanies } from "../../hooks/useCompanies";
import { QuickPersonCreate } from "@/components/crm/people/QuickPersonCreate";
import { AddPartnerDialog } from "@/components/crm/partners/AddPartnerDialog";
import { useCnpjApi } from "@/hooks/useCnpjApi";
import { findLocationIds } from "@/utils/locationUtils";
import { useUsers } from "@/hooks/useUsers";
import { getCurrentUserData } from "@/lib/auth";
import { UserAvatar } from "@/components/ui/user-avatar";
import { UserSelector } from "@/components/ui/user-selector";

// AIDEV-NOTE: Opções pré-cadastradas para origem da empresa
const origemOptions = [
  { label: 'Google', value: 'google' },
  { label: 'Indicação', value: 'indicacao' },
  { label: 'Evento', value: 'evento' },
  { label: 'Site', value: 'site' },
  { label: 'Campanha', value: 'campanha' },
  { label: 'Outbound', value: 'outbound' },
];

// AIDEV-NOTE: Principais setores brasileiros
const setorOptions = [
  { label: 'Agronegócio', value: 'agronegocio' },
  { label: 'Alimentício', value: 'alimenticio' },
  { label: 'Automotivo', value: 'automotivo' },
  { label: 'Construção Civil', value: 'construcao_civil' },
  { label: 'Educação', value: 'educacao' },
  { label: 'Energia', value: 'energia' },
  { label: 'Farmacêutico', value: 'farmaceutico' },
  { label: 'Financeiro', value: 'financeiro' },
  { label: 'Imobiliário', value: 'imobiliario' },
  { label: 'Indústria', value: 'industria' },
  { label: 'Logística', value: 'logistica' },
  { label: 'Mineração', value: 'mineracao' },
  { label: 'Petróleo e Gás', value: 'petroleo_gas' },
  { label: 'Saúde', value: 'saude' },
  { label: 'Serviços', value: 'servicos' },
  { label: 'Tecnologia', value: 'tecnologia' },
  { label: 'Telecomunicações', value: 'telecomunicacoes' },
  { label: 'Têxtil', value: 'textil' },
  { label: 'Turismo', value: 'turismo' },
  { label: 'Varejo', value: 'varejo' },
];

interface CompanyFormProps {
  company?: Company;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CompanyForm = ({
  company,
  onSuccess,
  open,
  onOpenChange,
}: CompanyFormProps) => {
  const queryClient = useQueryClient();
  const { createCompany, updateCompany } = useCompanies();
  const { consultarCnpj, isLoading: isLoadingCnpj } = useCnpjApi();
  const { data: users = [] } = useUsers();
  
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || '',
      razao_social: company?.razao_social || '',
      cnpj: company?.cnpj || '',
      state_id: company?.state_id || '',
      city_id: company?.city_id || '',
      company_type: company?.company_type || '',
      origem: company?.origem || '',
      setor: company?.setor || '',
      description: company?.description || '',
      email: company?.email || '',
      whatsapp: company?.whatsapp || '',
      celular: company?.celular || '',
      instagram: company?.instagram || '',
      creator_id: company?.creator_id || '',
      address: company?.address || {
        cep: '',
        rua: '',
        numero: '',
        complemento: '',
        bairro: ''
      }
    }
  });

  const [linkedPartners, setLinkedPartners] = useState<Partner[]>([]);
  const [linkedPeople, setLinkedPeople] = useState<Person[]>([]);
  const [isLinkPartnerDialogOpen, setIsLinkPartnerDialogOpen] = useState(false);
  const [isLinkPersonDialogOpen, setIsLinkPersonDialogOpen] = useState(false);
  const [partnersToUnlink, setPartnersToUnlink] = useState<string[]>([]);
  const [peopleToUnlink, setPeopleToUnlink] = useState<string[]>([]);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const [isQuickPersonCreateOpen, setIsQuickPersonCreateOpen] = useState(false);
  const [isAddPartnerDialogOpen, setIsAddPartnerDialogOpen] = useState(false);

  const { states, cities, loadingStates, loadingCities, onSubmit, loadCities } = useCompanyForm(company, onSuccess);
  const { companyPartners, companyPeople } = useCompanyRelationships(company?.id || "");

  // AIDEV-NOTE: Definir usuário atual como responsável padrão para novas empresas
  useEffect(() => {
    const setCurrentUserAsDefault = async () => {
      if (!company && !form.getValues('creator_id')) {
        try {
          const currentUser = await getCurrentUserData();
          if (currentUser?.id) {
            form.setValue('creator_id', currentUser.id);
          }
        } catch (error) {
          console.error('Erro ao obter usuário atual:', error);
        }
      }
    };
    
    setCurrentUserAsDefault();
  }, [company, form]);

  useEffect(() => {
    if (companyPartners?.length) {
      setLinkedPartners(companyPartners.map(cp => cp.partner));
    }
  }, [companyPartners]);

  useEffect(() => {
    if (companyPeople?.length) {
      setLinkedPeople(companyPeople.map(cp => cp.person));
    }
  }, [companyPeople]);

  useEffect(() => {
    const stateId = form.watch('state_id');
    if (stateId) {
      loadCities(stateId);
    } else {
      // Só limpa a cidade se não estiver editando
      if (!company?.city_id) {
        form.setValue('city_id', '');
      }
    }
  }, [form.watch('state_id')]);

  const handleRemovePartner = (partnerId: string) => {
    setLinkedPartners(prev => prev.filter(p => p.id !== partnerId));
    if (companyPartners?.some(cp => cp.partner.id === partnerId)) {
      setPartnersToUnlink(prev => [...prev, partnerId]);
    }
  };

  const handleRemovePerson = (personId: string) => {
    setLinkedPeople(prev => prev.filter(p => p.id !== personId));
    if (companyPeople?.some(cp => cp.person.id === personId)) {
      setPeopleToUnlink(prev => [...prev, personId]);
    }
  };

  const handleSubmit = async (data: CompanyFormValues) => {
    try {
      // AIDEV-NOTE: Mapear dados do formulário para o formato esperado pelo backend
      const formData = {
        name: data.name,
        razao_social: data.razao_social,
        cnpj: data.cnpj,
        email: data.email,
        phone: data.celular, // Mapear celular para phone (interface CreateCompanyData)
        whatsapp: data.whatsapp,
        website: data.website,
        description: data.description,
        origem: data.origem,
        setor: data.setor,
        segment: data.segment,
        size: data.size,
        company_type: data.company_type,
        state_id: data.state_id,
        city_id: data.city_id,
        creator_id: data.creator_id,
        // AIDEV-NOTE: Campos de endereço no nível raiz (não aninhados)
        cep: data.address?.cep || null,
        rua: data.address?.rua || null,
        numero: data.address?.numero || null,
        complemento: data.address?.complemento || null,
        bairro: data.address?.bairro || null,
      };

      const savedCompany = company 
        ? await updateCompany.mutateAsync({ id: company.id, data: formData }) 
        : await createCompany.mutateAsync(formData);

      if (partnersToUnlink.length > 0) {
        await Promise.all(
          partnersToUnlink.map(partnerId =>
            supabase
              .from('company_partners')
              .delete()
              .match({ 
                company_id: company.id,
                partner_id: partnerId 
              })
          )
        );
        queryClient.invalidateQueries(['company-partners', company.id]);
      }

      if (peopleToUnlink.length > 0) {
        await Promise.all(
          peopleToUnlink.map(personId =>
            supabase
              .from('web_company_people')
              .delete()
              .match({ 
                company_id: company.id,
                person_id: personId 
              })
          )
        );
        queryClient.invalidateQueries(['company-people', company.id]);
      }

      const newPeople = linkedPeople.filter(person => 
        !companyPeople?.some(cp => cp.person.id === person.id)
      );
      
      if (newPeople.length > 0) {
        const peoplePromises = newPeople.map(person => 
          supabase
            .from('web_company_people')
            .insert({
              company_id: savedCompany.id,
              person_id: person.id
            })
        );
        await Promise.all(peoplePromises);
        queryClient.invalidateQueries(['company-people', savedCompany.id]);
      }

      const newPartners = linkedPartners.filter(partner => 
        !companyPartners?.some(cp => cp.partner.id === partner.id)
      );

      if (newPartners.length > 0) {
        const partnerPromises = newPartners.map(partner =>
          supabase
            .from('company_partners')
            .insert({
              company_id: savedCompany.id,
              partner_id: partner.id
            })
        );
        await Promise.all(partnerPromises);
        queryClient.invalidateQueries(['company-partners', savedCompany.id]);
      }

      setPartnersToUnlink([]);
      setPeopleToUnlink([]);
      
      onSuccess?.(savedCompany);
      form.reset();
      onOpenChange?.(false);
    } catch (error) {
      console.error("Erro ao salvar empresa:", error);
    }
  };

  // Funções para formatar os campos
  const formatPhone = (value: string) => {
    if (!value) return value;
    value = value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    return value;
  };

  const formatCEP = (value: string) => {
    if (!value) return value;
    value = value.replace(/\D/g, '');
    value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    return value;
  };

  // Handlers para os campos com máscara
  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    form.setValue('whatsapp', formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    form.setValue('celular', formatted);
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    form.setValue('address.cep', formatted);
  };

  // AIDEV-NOTE: Função para consultar CNPJ e preencher automaticamente os campos
  // Acionada quando o usuário sai do campo CNPJ (onBlur)
  const handleCnpjBlur = async () => {
    const cnpjValue = form.getValues('cnpj');
    if (!cnpjValue || cnpjValue.length < 18) return; // CNPJ deve ter 18 caracteres com máscara

    const cnpjData = await consultarCnpj(cnpjValue);
    if (!cnpjData) return;

    // Preencher campos básicos
    if (cnpjData.nome && !form.getValues('razao_social')) {
      form.setValue('razao_social', cnpjData.nome);
    }
    
    if (cnpjData.fantasia && !form.getValues('name')) {
      form.setValue('name', cnpjData.fantasia);
    } else if (cnpjData.nome && !form.getValues('name')) {
      form.setValue('name', cnpjData.nome);
    }

    // Preencher campos de contato se disponíveis
    if (cnpjData.email && !form.getValues('email')) {
      form.setValue('email', cnpjData.email);
    }

    if (cnpjData.telefone && !form.getValues('whatsapp')) {
      const formattedPhone = formatPhone(cnpjData.telefone);
      form.setValue('whatsapp', formattedPhone);
    }

    if (cnpjData.telefone && !form.getValues('celular')) {
      const formattedPhone = formatPhone(cnpjData.telefone);
      form.setValue('celular', formattedPhone);
    }

    // Preencher endereço
    if (cnpjData.cep && !form.getValues('address.cep')) {
      const formattedCep = formatCEP(cnpjData.cep);
      form.setValue('address.cep', formattedCep);
    }

    if (cnpjData.logradouro && !form.getValues('address.rua')) {
      form.setValue('address.rua', cnpjData.logradouro);
    }

    if (cnpjData.numero && !form.getValues('address.numero')) {
      form.setValue('address.numero', cnpjData.numero);
    }

    if (cnpjData.complemento && !form.getValues('address.complemento')) {
      form.setValue('address.complemento', cnpjData.complemento);
    }

    if (cnpjData.bairro && !form.getValues('address.bairro')) {
      form.setValue('address.bairro', cnpjData.bairro);
    }

    // Buscar e preencher estado e cidade
    if (cnpjData.uf && cnpjData.municipio) {
      try {
        const { stateId, cityId } = await findLocationIds(cnpjData.uf, cnpjData.municipio);
        
        if (stateId && !form.getValues('state_id')) {
          form.setValue('state_id', stateId);
          // Carregar cidades do estado
          await loadCities(stateId);
        }

        if (cityId && !form.getValues('city_id')) {
          form.setValue('city_id', cityId);
        }
      } catch (error) {
        console.error('Erro ao buscar localização:', error);
      }
    }

    // AIDEV-NOTE: Preencher descrição com informações detalhadas da empresa
    if (!form.getValues('description')) {
      const descricaoCompleta = [
        cnpjData.data_inicio_atividade ? `DATA DE ABERTURA DA EMPRESA: ${cnpjData.data_inicio_atividade}` : '',
        cnpjData.porte ? `PORTE DA EMPRESA: ${cnpjData.porte}` : '',
        cnpjData.situacao ? `SITUAÇÃO CADASTRAL: ${cnpjData.situacao}` : '',
        cnpjData.data_situacao ? `DATA DA SITUAÇÃO CADASTRAL: ${cnpjData.data_situacao}` : '',
        cnpjData.qsa && cnpjData.qsa.length > 0 ? `QUADRO DE SÓCIOS E ADMINISTRADORES:\n${cnpjData.qsa.map(socio => `- ${socio.nome} (${socio.qual})`).join('\n')}` : '',
        cnpjData.cnae_fiscal && cnpjData.cnae_fiscal_descricao ? `CÓDIGO E DESCRIÇÃO DA ATIVIDADE ECONÔMICA PRINCIPAL: ${cnpjData.cnae_fiscal} - ${cnpjData.cnae_fiscal_descricao}` : ''
      ].filter(Boolean).join('\n\n');

      form.setValue('description', descricaoCompleta);
    }

    // Expandir seção de endereço se dados foram preenchidos
    if (cnpjData.cep || cnpjData.logradouro || cnpjData.bairro) {
      setIsAddressExpanded(true);
    }
  };

  // Tipos de empresa conforme definido no banco
  const companyTypes = [
    { label: 'Possível Cliente (Lead)', value: 'Possível Cliente (Lead)' },
    { label: 'Cliente Ativo', value: 'Cliente Ativo' },
    { label: 'Empresa Parceira', value: 'Empresa Parceira' },
    { label: 'Cliente Inativo', value: 'Cliente Inativo' },
    { label: 'Outro', value: 'Outro' }
  ] as const;

  type CompanyType = typeof companyTypes[number]['value'];

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={(value) => {
          // Prevenir fechamento se estiver interagindo com combobox
          const activeElement = document.activeElement;
          if (
            activeElement?.getAttribute('role') === 'combobox' ||
            activeElement?.closest('[role="listbox"]') ||
            activeElement?.closest('[role="combobox"]') ||
            activeElement?.closest('[role="option"]')
          ) {
            return;
          }
          onOpenChange?.(value);
        }}
      >
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            if (
              target.closest('[role="listbox"]') || 
              target.closest('[role="combobox"]') ||
              target.closest('[role="option"]')
            ) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{company ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
                {company && (
                  <DialogDescription>
                    Edite as informações da empresa
                  </DialogDescription>
                )}
              </div>
              
              {/* AIDEV-NOTE: Seletor de responsável no cabeçalho - Posicionado à direita */}
              {!company && (
                <div className="flex-shrink-0">
                  <Form {...form}>
                    <FormField
                      control={form.control}
                      name="creator_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <UserSelector
                              users={users}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Selecionar responsável interno"
                              className="w-auto"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Form>
                </div>
              )}
            </div>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* AIDEV-NOTE: Seletor de responsável para modo de edição */}
              {company && (
                <FormField
                  control={form.control}
                  name="creator_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <UserSelector
                          users={users}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecionar responsável interno"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Divisor elegante */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>

              {/* Título da seção Dados Básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Dados básicos</h3>

                {/* Dados Básicos - Reorganizados conforme solicitação */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Digite o nome" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          CNPJ*
                          {isLoadingCnpj && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                              Consultando...
                            </div>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="00.000.000/0000-00"
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value
                                .replace(/\D/g, '')
                                .replace(/^(\d{2})(\d)/, '$1.$2')
                                .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                                .replace(/\.(\d{3})(\d)/, '.$1/$2')
                                .replace(/(\/\d{4})(\d)/, '$1-$2')
                                .slice(0, 18);
                              field.onChange(value);
                            }}
                            onBlur={handleCnpjBlur}
                            disabled={isLoadingCnpj}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="razao_social"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razão social</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Digite a razão social" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                     control={form.control}
                     name="company_type"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Categoria*</FormLabel>
                         <FormControl>
                           <Combobox
                             items={companyTypes}
                             value={field.value as CompanyType}
                             onChange={field.onChange}
                             placeholder="Selecione a categoria"
                             onOpenChange={(isOpen) => {
                               // Prevenir fechamento do Dialog quando abrir o Combobox
                               if (isOpen) {
                                 // Não fazer nada para manter o dialog aberto
                               }
                             }}
                           />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <FormField
                     control={form.control}
                     name="origem"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Origem</FormLabel>
                         <FormControl>
                           <Combobox
                             items={origemOptions}
                             value={field.value}
                             onChange={field.onChange}
                             placeholder="Selecione"
                           />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <FormField
                     control={form.control}
                     name="setor"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Setor</FormLabel>
                         <FormControl>
                           <Combobox
                             items={setorOptions}
                             value={field.value}
                             onChange={field.onChange}
                             placeholder="Selecione"
                           />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>

                 {/* Campo Descrição - largura completa */}
                 <FormField
                   control={form.control}
                   name="description"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Descrição</FormLabel>
                       <FormControl>
                         <Textarea 
                           {...field} 
                           placeholder="Informações serão preenchidas automaticamente via consulta CNPJ"
                           value={field.value || ""}
                           rows={8}
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
              </div>

              {/* Localização */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Home className="h-4 w-4" />
                  <h3 className="text-sm font-medium">Localização</h3>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="state_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado*</FormLabel>
                        <FormControl onClick={(e) => e.stopPropagation()}>
                          <Combobox
                            items={states.map(state => ({
                              label: state.name,
                              value: state.id
                            }))}
                            value={field.value}
                            onChange={field.onChange}
                            loading={loadingStates}
                            placeholder="Selecione um estado"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade*</FormLabel>
                        <FormControl onClick={(e) => e.stopPropagation()}>
                          <Combobox
                            items={cities.map(city => ({
                            label: city.name,
                            value: city.id
                          }))}
                            value={field.value}
                            onChange={field.onChange}
                            loading={loadingCities}
                            placeholder="Selecione uma cidade"
                            disabled={!form.watch('state_id') || loadingCities}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Collapsible
                  open={isAddressExpanded}
                  onOpenChange={setIsAddressExpanded}
                  className="space-y-4"
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 w-full justify-start hover:bg-muted/50"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isAddressExpanded ? 'transform rotate-180' : ''}`} />
                      <span className="text-sm">Detalhes do Endereço</span>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-4">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="address.cep"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                onChange={handleCEPChange}
                                maxLength={9}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address.rua"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rua</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Nome da rua" value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="address.numero"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="123" value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address.complemento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Apto 123" value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address.bairro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Nome do bairro" value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Contato */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="email@exemplo.com" value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          onChange={handleWhatsAppChange}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="celular"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          onChange={handlePhoneChange}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <AtSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field}
                            className="pl-8"
                            placeholder="usuario"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pessoas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <h2 className="text-sm font-medium">Pessoas</h2>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLinkPersonDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Pessoa
                  </Button>
                </div>
                <div className="space-y-2">
                  {linkedPeople.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{person.name}</span>
                        {person.email && (
                          <span className="text-sm text-muted-foreground">
                            {person.email}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemovePerson(person.id)}
                      >
                        <X className="h-4 w-4" />
                        Desvincular
                      </Button>
                    </div>
                  ))}
                  {linkedPeople.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                      Nenhuma pessoa vinculada
                    </div>
                  )}
                </div>
              </div>

              {/* Parceiros - Só aparece se for Empresa Parceira */}
              {form.watch('company_type') === 'Empresa Parceira' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <h2 className="text-sm font-medium">Parceiros Vinculados</h2>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsLinkPartnerDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Parceiro
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {linkedPartners.map((partner) => (
                      <div
                        key={partner.id}
                        className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{partner.name}</span>
                          {partner.email && (
                            <span className="text-sm text-muted-foreground">
                              {partner.email}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemovePartner(partner.id)}
                        >
                          <X className="h-4 w-4" />
                          Desvincular
                        </Button>
                      </div>
                    ))}
                    {linkedPartners.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                        Nenhum parceiro vinculado
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="pt-4 border-t">
                <Button type="submit" className="w-full">
                  {company ? "Salvar alterações" : "Criar empresa"}
                </Button>
              </div>
            </form>
          </Form>

        </DialogContent>
      </Dialog>

      {isLinkPersonDialogOpen && (
        <LinkPersonDialog
          open={isLinkPersonDialogOpen}
          onOpenChange={setIsLinkPersonDialogOpen}
          companyId={company?.id ?? ""}
          onLink={(person) => {
            setLinkedPeople((prev) => [...prev, person]);
          }}
          currentLinkedPeople={linkedPeople}
        />
      )}

      {isLinkPartnerDialogOpen && form.watch('company_type') === 'Empresa Parceira' && (
        <LinkPartnerDialog
          open={isLinkPartnerDialogOpen}
          onOpenChange={setIsLinkPartnerDialogOpen}
          companyId={company?.id ?? ""}
          onLink={(partner) => {
            setLinkedPartners((prev) => [...prev, partner]);
          }}
        />
      )}

      {isQuickPersonCreateOpen && (
        <QuickPersonCreate
          open={isQuickPersonCreateOpen}
          onOpenChange={setIsQuickPersonCreateOpen}
          onSuccess={(person) => {
            setLinkedPeople((prev) => [...prev, person]);
            setIsQuickPersonCreateOpen(false);
          }}
        />
      )}

      {isAddPartnerDialogOpen && (
        <AddPartnerDialog
          open={isAddPartnerDialogOpen}
          onOpenChange={setIsAddPartnerDialogOpen}
          onSuccess={(partner) => {
            setLinkedPartners((prev) => [...prev, partner]);
            setIsAddPartnerDialogOpen(false);
          }}
        />
      )}
    </>
  );
};

// AIDEV-NOTE: Exportar opções para reutilização em outros componentes
export { origemOptions, setorOptions };

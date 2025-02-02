import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Building2, 
  Mail, 
  Phone, 
  Instagram,
  MapPin,
  FileText,
  X,
  Building,
  User2,
  Hash,
  FileSpreadsheet,
  AtSign,
  MessageSquare,
  Smartphone,
  MapPinned,
  Map,
  Home,
  Navigation,
  Pencil,
  Users,
  UserPlus,
  Plus,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { useLocation } from "@/hooks/useLocation";
import { useCompanyRelationships } from "@/features/companies/hooks/useCompanyRelationships";
import { useLocationForm } from "@/hooks/useLocationForm";
import { Partner } from "@/types/database/partner";
import { Person } from "@/types/database/person";
import { toast } from "sonner";
import { formatCEP, formatPhone, formatCNPJ } from "@/lib/format";
import { supabase } from "@/lib/supabase";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Combobox } from "@/components/ui/combobox";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Database } from "@/types/supabase";
import { LinkPersonDialog } from "@/features/companies/components/related/LinkPersonDialog";
import { LinkPartnerDialog } from "@/features/companies/components/related/LinkPartnerDialog";
import { RelatedPeopleList } from "@/features/companies/components/related/RelatedPeopleList";
import { RelatedPartnersList } from "@/features/companies/components/related/RelatedPartnersList";

type Company = Database["public"]["Tables"]["companies"]["Row"];

const companyFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  razao_social: z.string().optional(),
  cnpj: z.string().optional(),
  state_id: z.string().optional(),
  city_id: z.string().optional(),
  company_type: z.string(),
  email: z.string().optional(),
  whatsapp: z.string().optional(),
  celular: z.string().optional(),
  instagram: z.string().optional(),
  address: z.object({
    cep: z.string().optional(),
    rua: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
  }).optional(),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company;
  onSuccess?: (company: Company) => void;
}

export function CompanyForm({ open, onOpenChange, company, onSuccess }: CompanyFormProps) {
  const queryClient = useQueryClient();
  const [linkedPartners, setLinkedPartners] = useState<Partner[]>([]);
  const [linkedPeople, setLinkedPeople] = useState<Person[]>([]);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isLinkPartnerDialogOpen, setIsLinkPartnerDialogOpen] = useState(false);
  const [isLinkPersonDialogOpen, setIsLinkPersonDialogOpen] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(false);

  const { states, cities, isLoadingStates } = useLocation();
  const {
    selectedStateId,
    selectedCityId,
    setSelectedCityId,
    handleStateChange,
    filteredCities,
    updateStates,
  } = useLocationForm();

  // Atualiza os estados quando o componente carrega
  useEffect(() => {
    if (states.length > 0) {
      updateStates(states);
    }
  }, [states]);

  // Atualiza o estado e cidade quando o formulário carrega com uma empresa
  useEffect(() => {
    if (company?.state_id) {
      handleStateChange(company.state_id);
      if (company.city_id) {
        setSelectedCityId(company.city_id);
      }
    }
  }, [company]);

  // Atualiza o form quando o estado ou cidade mudam
  useEffect(() => {
    form.setValue("state_id", selectedStateId);
    form.setValue("city_id", selectedCityId);
  }, [selectedStateId, selectedCityId]);

  const onStateSelect = (stateId: string) => {
    handleStateChange(stateId);
    form.setValue("city_id", ""); // Limpa a cidade quando troca o estado
  };

  const onCitySelect = (cityId: string) => {
    setSelectedCityId(cityId);
  };

  const { createCompany, updateCompany } = useCompanies();
  const { companyPartners, companyPeople } = useCompanyRelationships(company?.id || "");

  // Carregar relacionamentos existentes quando o componente montar
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

  // Efeito para inicializar estado e cidade quando editar uma empresa existente
  useEffect(() => {
    if (company && states.length > 0) {
      const state = states.find(s => s.name === company.estado);
      if (state) {
        handleStateChange(state.id);
        
        // Buscar cidades do estado
        const cityData = async () => {
          const { data, error } = await supabase
            .from("cities")
            .select("*")
            .eq("state_id", state.id)
            .order("name");
          if (error) throw error;
          return data;
        };
        cityData().then((cityData) => {
          // Normalizar o nome da cidade do CEP
          const normalizedViaCepCity = company.cidade
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
          
          // Encontrar a cidade correspondente
          const city = cityData.find(c => {
            const normalizedCityName = c.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim();
            return normalizedCityName === normalizedViaCepCity;
          });

          if (city) {
            setSelectedCityId(city.id);
          } else {
            toast.error("Cidade não encontrada automaticamente. Por favor, selecione manualmente.");
          }
        });
      }
    }
  }, [company, states]);

  useEffect(() => {
    if (company && selectedStateId && cities.length > 0) {
      const city = cities.find(c => c.name === company.cidade);
      if (city) {
        setSelectedCityId(city.id);
      }
    }
  }, [company, selectedStateId, cities]);

  const handleRemovePartner = (partnerId: string) => {
    setLinkedPartners(prev => prev.filter(p => p.id !== partnerId));
    // Se o parceiro já existia (está em companyPartners), adiciona à lista de desvinculação
    if (companyPartners?.some(cp => cp.partner.id === partnerId)) {
      setPartnersToUnlink(prev => [...prev, partnerId]);
    }
  };

  const handleRemovePerson = (personId: string) => {
    setLinkedPeople(prev => prev.filter(p => p.id !== personId));
    // Se a pessoa já existia (está em companyPeople), adiciona à lista de desvinculação
    if (companyPeople?.some(cp => cp.person.id === personId)) {
      setPeopleToUnlink(prev => [...prev, personId]);
    }
  };

  const handleSubmit = async (data: CompanyFormData) => {
    try {
      // Limpa os campos vazios para que sejam enviados como null
      const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
        acc[key] = value === "" ? null : value;
        return acc;
      }, {} as Record<string, any>);

      let savedCompany;
      if (company) {
        // Atualizando empresa existente
        savedCompany = await updateCompany({
          id: company.id,
          ...cleanedData,
        });

        // Processar desvinculações primeiro
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
          // Invalidar cache dos parceiros
          queryClient.invalidateQueries(['company-partners', company.id]);
        }

        if (peopleToUnlink.length > 0) {
          await Promise.all(
            peopleToUnlink.map(personId =>
              supabase
                .from('company_people')
                .delete()
                .match({ 
                  company_id: company.id,
                  person_id: personId 
                })
            )
          );
          // Invalidar cache das pessoas
          queryClient.invalidateQueries(['company-people', company.id]);
        }
      } else {
        savedCompany = await createCompany(cleanedData);
      }

      // Após salvar a empresa, criar os novos vínculos
      try {
        // Criar vínculos com pessoas (apenas novas)
        const newPeople = linkedPeople.filter(person => 
          !companyPeople?.some(cp => cp.person.id === person.id)
        );
        
        if (newPeople.length > 0) {
          const peoplePromises = newPeople.map(person => 
            supabase
              .from('company_people')
              .insert({
                company_id: savedCompany.id,
                person_id: person.id,
                client_id: savedCompany.client_id
              })
          );
          await Promise.all(peoplePromises);
          // Invalidar cache das pessoas após adicionar novas
          queryClient.invalidateQueries(['company-people', savedCompany.id]);
        }

        // Criar vínculos com parceiros (apenas novos)
        const newPartners = linkedPartners.filter(partner => 
          !companyPartners?.some(cp => cp.partner.id === partner.id)
        );

        if (newPartners.length > 0) {
          const partnerPromises = newPartners.map(partner =>
            supabase
              .from('company_partners')
              .insert({
                company_id: savedCompany.id,
                partner_id: partner.id,
                client_id: savedCompany.client_id
              })
          );
          await Promise.all(partnerPromises);
          // Invalidar cache dos parceiros após adicionar novos
          queryClient.invalidateQueries(['company-partners', savedCompany.id]);
        }

        // Invalidar cache geral da empresa
        queryClient.invalidateQueries(['companies', savedCompany.id]);
      } catch (relationError) {
        console.error("Erro ao gerenciar vínculos:", relationError);
        toast.error("Erro ao gerenciar vínculos");
      }

      toast.success(
        company ? "Empresa atualizada com sucesso!" : "Empresa criada com sucesso!"
      );
      
      // Limpar estados de desvinculação
      setPartnersToUnlink([]);
      setPeopleToUnlink([]);
      
      onSuccess?.(savedCompany);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar empresa:", error);
      // Se o erro for de UUID inválido e a empresa foi criada, não mostramos o erro
      if (!(error as any)?.message?.includes('invalid input syntax for type uuid')) {
        toast.error("Erro ao salvar empresa");
      }
    }
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      // Preencher os campos com os dados do CEP
      const form = e.target.form as HTMLFormElement;
      if (form) {
        form.querySelector<HTMLInputElement>('input[name="rua"]')!.value = data.logradouro;
        form.querySelector<HTMLInputElement>('input[name="bairro"]')!.value = data.bairro;

        // Encontrar o estado correspondente
        const state = states.find(s => s.uf.toLowerCase() === data.uf.toLowerCase());
        if (state) {
          handleStateChange(state.id);
          
          // Buscar cidades do estado
          const cityData = await supabase
            .from("cities")
            .select("*")
            .eq("state_id", state.id)
            .order("name");
          
          if (cityData.error) throw cityData.error;
          
          // Normalizar o nome da cidade do CEP
          const normalizedViaCepCity = data.localidade
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
          
          // Encontrar a cidade correspondente
          const city = cityData.data.find(c => {
            const normalizedCityName = c.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim();
            return normalizedCityName === normalizedViaCepCity;
          });

          if (city) {
            setSelectedCityId(city.id);
          } else {
            toast.error("Cidade não encontrada automaticamente. Por favor, selecione manualmente.");
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: company?.name || "",
      razao_social: company?.razao_social || "",
      cnpj: company?.cnpj || "",
      state_id: company?.estado || "",
      city_id: company?.cidade || "",
      company_type: company?.company_type || "",
      email: company?.email || "",
      whatsapp: company?.whatsapp || "",
      celular: company?.celular || "",
      instagram: company?.instagram || "",
      address: {
        cep: company?.cep || "",
        rua: company?.rua || "",
        numero: company?.numero || "",
        complemento: company?.complemento || "",
        bairro: company?.bairro || "",
      },
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name || "",
        razao_social: company.razao_social || "",
        cnpj: company.cnpj || "",
        state_id: company.estado || "",
        city_id: company.cidade || "",
        company_type: company.company_type || "",
        email: company.email || "",
        whatsapp: company.whatsapp || "",
        celular: company.celular || "",
        instagram: company.instagram || "",
        address: {
          cep: company.cep || "",
          rua: company.rua || "",
          numero: company.numero || "",
          complemento: company.complemento || "",
          bairro: company.bairro || "",
        },
      });
    }
  }, [company, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[800px] max-h-[80vh] overflow-y-auto" 
        aria-describedby="company-form-description"
      >
        <DialogHeader>
          <DialogTitle>{company ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
          <DialogDescription id="company-form-description">
            {company ? "Edite os dados da empresa" : "Preencha os dados da nova empresa"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* Dados Básicos */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-muted">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Dados Básicos</span>
              </div>
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-normal text-muted-foreground">
                        Nome *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="border-0 border-b border-muted focus-visible:ring-0 rounded-none px-0 h-8 bg-transparent focus-visible:border-primary transition-colors" 
                          placeholder="Clique aqui para adicionar"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="razao_social"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-normal text-muted-foreground">
                        Razão Social
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="border-0 border-b border-muted focus-visible:ring-0 rounded-none px-0 h-8 bg-transparent focus-visible:border-primary transition-colors" 
                          placeholder="Clique aqui para adicionar"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-normal text-muted-foreground">
                        CNPJ
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="border-0 border-b border-muted focus-visible:ring-0 rounded-none px-0 h-8 bg-transparent focus-visible:border-primary transition-colors" 
                          placeholder="Clique aqui para adicionar"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-muted">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Contato</span>
              </div>
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-normal text-muted-foreground">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email" 
                          className="border-0 border-b border-muted focus-visible:ring-0 rounded-none px-0 h-8 bg-transparent focus-visible:border-primary transition-colors" 
                          placeholder="Clique aqui para adicionar"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
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
                          placeholder="(00) 00000-0000"
                          {...field}
                          value={formatPhone(field.value || "")}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            field.onChange(value);
                          }}
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
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-normal text-muted-foreground">
                        Instagram
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="border-0 border-b border-muted focus-visible:ring-0 rounded-none px-0 h-8 bg-transparent focus-visible:border-primary transition-colors" 
                          placeholder="Clique aqui para adicionar"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Localização */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-muted">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Localização</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="state_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Combobox
                          items={states.map(state => ({
                            label: state.name,
                            value: state.id,
                            description: state.uf
                          }))}
                          value={selectedStateId}
                          onChange={onStateSelect}
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
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Combobox
                          items={filteredCities.map(city => ({
                            label: city.name,
                            value: city.id
                          }))}
                          value={selectedCityId}
                          onChange={onCitySelect}
                          placeholder={!selectedStateId ? "Selecione um estado primeiro" : "Selecione uma cidade"}
                          disabled={!selectedStateId}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Botão Expandir/Retrair */}
              <Button
                type="button"
                variant="ghost"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => setShowFullAddress(!showFullAddress)}
              >
                {showFullAddress ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Mostrar endereço completo
                  </>
                )}
              </Button>

              {/* Campos de Endereço Completo */}
              {showFullAddress && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address.cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="CEP"
                              {...field}
                              onChange={(e) => {
                                const formatted = formatCEP(e.target.value);
                                field.onChange(formatted);
                              }}
                              onBlur={handleCepBlur}
                              disabled={isLoadingCep}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="address.rua"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Rua</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input placeholder="Número" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address.bairro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input placeholder="Bairro" {...field} />
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
                            <Input placeholder="Complemento" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pessoas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
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
                    className="flex items-center justify-between p-2 rounded-lg border"
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
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma pessoa vinculada
                  </div>
                )}
              </div>
            </div>

            {/* Parceiros Vinculados */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
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
                    className="flex items-center justify-between p-2 rounded-lg border"
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
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Nenhum parceiro vinculado
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {company ? "Salvar alterações" : "Criar empresa"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      {/* Diálogos */}
      <LinkPartnerDialog
        open={isLinkPartnerDialogOpen}
        onOpenChange={setIsLinkPartnerDialogOpen}
        companyId={company?.id || ""}
        onLink={(partner) => {
          setLinkedPartners((prev) => [...prev, partner]);
        }}
      />

      <LinkPersonDialog
        open={isLinkPersonDialogOpen}
        onOpenChange={setIsLinkPersonDialogOpen}
        companyId={company?.id || ""}
        onLink={(person) => {
          setLinkedPeople((prev) => [...prev, person]);
        }}
      />
    </Dialog>
  );
}

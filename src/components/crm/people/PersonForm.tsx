import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanySelect } from "@/components/ui/company-select";
import { usePeople } from "@/hooks/usePeople";
import { useLocation } from "@/hooks/useLocation";
import { Loader2, User } from "lucide-react";

// AIDEV-NOTE: Schema de validação completo para criação de pessoas
const personFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  whatsapp: z.string().min(1, "WhatsApp é obrigatório"),
  phone: z.string().optional().or(z.literal("")),
  cpf: z.string().optional().or(z.literal("")),
  rg: z.string().optional().or(z.literal("")),
  person_type: z.enum(["LEAD", "CLIENTE", "COLABORADOR"]).optional(),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  cargo: z.string().min(1, "Cargo é obrigatório"),
  description: z.string().optional().or(z.literal("")),
  // Endereço
  cep: z.string().optional().or(z.literal("")),
  rua: z.string().optional().or(z.literal("")),
  numero: z.string().optional().or(z.literal("")),
  bairro: z.string().optional().or(z.literal("")),
  complemento: z.string().optional().or(z.literal("")),
});

type PersonFormValues = z.infer<typeof personFormSchema>;

interface PersonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: any;
  onSuccess?: () => void;
}

// AIDEV-NOTE: Funções de formatação para campos específicos
const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .substr(0, 14);
};

const formatRG = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1})/, '$1-$2')
    .substr(0, 12);
};

const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substr(0, 9);
};

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substr(0, 14);
  } else {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substr(0, 15);
  }
};

export function PersonForm({ open, onOpenChange, person, onSuccess }: PersonFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  
  const { createPerson, updatePerson } = usePeople();
  const { user } = useAuth();
  const { states, getCitiesByState, fetchCitiesByStateId } = useLocation();
  
  // Buscar cidades do estado selecionado
  const { data: cities = [] } = getCitiesByState(selectedStateId || "");

  // Buscar dados do colaborador logado
  const { data: collaborator } = useQuery({
    queryKey: ['collaborator', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      name: person?.name || "",
      email: person?.email || "",
      whatsapp: person?.whatsapp || "",
      phone: person?.phone || "",
      cpf: person?.cpf || "",
      rg: person?.rg || "",
      person_type: person?.person_type || undefined,
      categoria: person?.categoria || "",
      cargo: person?.cargo || "",
      description: person?.description || "",
      cep: person?.cep || "",
      rua: person?.rua || "",
      numero: person?.numero || "",
      bairro: person?.bairro || "",
      complemento: person?.complemento || "",
    },
  });

  // Preencher dados se estiver editando
  useEffect(() => {
    if (person) {
      setSelectedCompanyId(person.company_id || "");
      setSelectedStateId(person.estado || "");
      setSelectedCityId(person.cidade || "");
    }
  }, [person]);

  // AIDEV-NOTE: Busca automática de endereço via CEP
  const handleCepBlur = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      // Preencher campos de endereço
      form.setValue("rua", data.logradouro);
      form.setValue("bairro", data.bairro);

      // Encontrar estado e cidade
      const state = states.find(s => s.uf.toLowerCase() === data.uf.toLowerCase());
      if (state) {
        setSelectedStateId(state.id);
        
        try {
          const cityData = await fetchCitiesByStateId(state.id);
          const normalizedViaCepCity = data.localidade
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
          
          const city = cityData.find(c => {
            const normalizedCityName = c.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim();
            return normalizedCityName === normalizedViaCepCity;
          });

          if (city) {
            setSelectedCityId(city.id.toString());
          }
        } catch (error) {
          console.error("Erro ao buscar cidades:", error);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const onSubmit = async (data: PersonFormValues) => {
    setIsSubmitting(true);
    try {
      const personData = {
        ...data,
        company_id: selectedCompanyId || undefined,
        estado: selectedStateId || undefined,
        cidade: selectedCityId || undefined,
        responsavel_id: user?.id,
        client_id: collaborator?.client_id,
      };

      if (person) {
        await updatePerson(person.id, personData);
        toast.success("Pessoa atualizada com sucesso!");
      } else {
        await createPerson(personData);
        toast.success("Pessoa criada com sucesso!");
      }

      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar pessoa:", error);
      toast.error("Erro ao salvar pessoa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedCompanyId("");
    setSelectedStateId("");
    setSelectedCityId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <DialogTitle>
              {person ? "Editar Pessoa" : "Nova Pessoa"}
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {person ? "Atualize os dados da pessoa" : "Preencha os dados para criar uma nova pessoa"}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dados Básicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Ex: joao@email.com" {...field} />
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
                      <FormLabel>WhatsApp *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: (11) 99999-9999" 
                          {...field}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone Adicional</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: (11) 3333-3333" 
                          {...field}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: 123.456.789-00" 
                          {...field}
                          onChange={(e) => {
                            const formatted = formatCPF(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: 12.345.678-9" 
                          {...field}
                          onChange={(e) => {
                            const formatted = formatRG(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Classificação */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Classificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="person_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Pessoa</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LEAD">Lead</SelectItem>
                          <SelectItem value="CLIENTE">Cliente</SelectItem>
                          <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CLIENTE">Cliente</SelectItem>
                          <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
                          <SelectItem value="FUNCIONARIO">Funcionário</SelectItem>
                          <SelectItem value="PARCEIRO">Parceiro</SelectItem>
                          <SelectItem value="OUTRO">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cargo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PROPRIETARIO">Proprietário</SelectItem>
                          <SelectItem value="DIRETOR">Diretor</SelectItem>
                          <SelectItem value="GERENTE">Gerente</SelectItem>
                          <SelectItem value="COORDENADOR">Coordenador</SelectItem>
                          <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                          <SelectItem value="ANALISTA">Analista</SelectItem>
                          <SelectItem value="ASSISTENTE">Assistente</SelectItem>
                          <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                          <SelectItem value="CONTATO">Contato</SelectItem>
                          <SelectItem value="OUTRO">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Empresa */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Empresa</h3>
              <CompanySelect
                value={selectedCompanyId}
                onChange={setSelectedCompanyId}
              />
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="00000-000" 
                            {...field}
                            onChange={(e) => {
                              const formatted = formatCEP(e.target.value);
                              field.onChange(formatted);
                            }}
                            onBlur={(e) => handleCepBlur(e.target.value)}
                          />
                          {isLoadingCep && (
                            <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin" />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="rua"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rua</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Rua das Flores" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="complemento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Apto 101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select value={selectedStateId} onValueChange={setSelectedStateId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.name} ({state.uf})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                </div>
              </div>

              {selectedStateId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <Select value={selectedCityId} onValueChange={setSelectedCityId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a cidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                </div>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Observações</h3>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informações adicionais sobre a pessoa..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {person ? "Atualizar" : "Criar"} Pessoa
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
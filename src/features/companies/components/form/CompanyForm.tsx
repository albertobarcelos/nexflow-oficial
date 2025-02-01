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
  Plus
} from "lucide-react";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { useLocation } from "@/hooks/useLocation";
import { useCompanyRelationships } from "@/features/companies/hooks/useCompanyRelationships";
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  name: z.string().min(1, "Nome fantasia é obrigatório"),
  razao_social: z.string().optional(),
  cnpj: z.string().optional(),
  description: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  whatsapp: z.string().min(1, "WhatsApp é obrigatório"),
  celular: z.string().optional(),
  instagram: z.string().optional(),
  cep: z.string().optional(),
  pais: z.string().optional(),
  state_id: z.string().optional().nullable(),
  city_id: z.string().optional().nullable(),
  bairro: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  privacidade: z.enum(["todos", "somente-eu"]).default("todos"),
  company_type: z.enum([
    "Possível Cliente (Lead)",
    "Cliente Ativo",
    "Empresa Parceira",
    "Cliente Inativo",
    "Outro"
  ], {
    required_error: "Tipo de empresa é obrigatório"
  }),
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
  const [partnersToUnlink, setPartnersToUnlink] = useState<string[]>([]);
  const [peopleToUnlink, setPeopleToUnlink] = useState<string[]>([]);
  const [isLinkPartnerDialogOpen, setIsLinkPartnerDialogOpen] = useState(false);
  const [isLinkPersonDialogOpen, setIsLinkPersonDialogOpen] = useState(false);
  
  const { createCompany, updateCompany } = useCompanies();
  const { companyPartners, companyPeople, addCompanyPartner, addCompanyPerson } = useCompanyRelationships(company?.id || "");

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

  const { 
    states, 
    cities, 
    isLoadingStates, 
    isLoadingCities, 
    selectedStateId, 
    setSelectedStateId, 
    selectedCityId, 
    setSelectedCityId 
  } = useLocation();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: company?.name || "",
      razao_social: company?.razao_social || "",
      cnpj: company?.cnpj || "",
      email: company?.email || "",
      whatsapp: company?.whatsapp || "",
      celular: company?.celular || "",
      instagram: company?.instagram || "",
      cep: company?.cep || "",
      pais: "Brasil",
      state_id: company?.state_id || "",
      city_id: company?.city_id || "",
      bairro: company?.bairro || "",
      rua: company?.rua || "",
      numero: company?.numero || "",
      complemento: company?.complemento || "",
      privacidade: "todos",
      company_type: company?.company_type || "Possível Cliente (Lead)",
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name || "",
        razao_social: company.razao_social || "",
        cnpj: company.cnpj || "",
        email: company.email || "",
        whatsapp: company.whatsapp || "",
        celular: company.celular || "",
        instagram: company.instagram || "",
        cep: company.cep || "",
        pais: "Brasil",
        state_id: company.state_id || "",
        city_id: company.city_id || "",
        bairro: company.bairro || "",
        rua: company.rua || "",
        numero: company.numero || "",
        complemento: company.complemento || "",
        privacidade: "todos",
        company_type: company.company_type || "Possível Cliente (Lead)",
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
                        Nome Fantasia *
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

                <FormField
                  control={form.control}
                  name="company_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Empresa</FormLabel>
                      <FormControl>
                        <Select 
                          defaultValue={field.value} 
                          onValueChange={field.onChange}
                          name={field.name}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o tipo de empresa" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Possível Cliente (Lead)">Possível Cliente (Lead)</SelectItem>
                            <SelectItem value="Cliente Ativo">Cliente Ativo</SelectItem>
                            <SelectItem value="Empresa Parceira">Empresa Parceira</SelectItem>
                            <SelectItem value="Cliente Inativo">Cliente Inativo</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
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

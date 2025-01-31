import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
  Navigation
} from "lucide-react";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { useLocation } from "@/hooks/useLocation";
import { toast } from "sonner";
import { formatCEP, formatPhone, formatCNPJ } from "@/lib/format";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

type Company = Database["public"]["Tables"]["companies"]["Row"];

const formSchema = z.object({
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
  state_id: z.string().optional(),
  city_id: z.string().optional(),
  bairro: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  privacidade: z.enum(["todos", "somente-eu"]).default("todos"),
});

type FormValues = z.infer<typeof formSchema>;

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company;
  onSuccess?: (company: Company) => void;
}

export function CompanyForm({ open, onOpenChange, company, onSuccess }: CompanyFormProps) {
  const { updateCompany, createCompany } = useCompanies();
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      razao_social: "",
      cnpj: "",
      description: "",
      email: "",
      whatsapp: "",
      celular: "",
      instagram: "",
      cep: "",
      pais: "Brasil",
      state_id: "",
      city_id: "",
      bairro: "",
      rua: "",
      numero: "",
      complemento: "",
      privacidade: "todos",
    }
  });

  // Inicializar dados da empresa quando ela existir
  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name || "",
        razao_social: company.razao_social || "",
        cnpj: company.cnpj || "",
        description: company.description || "",
        email: company.email || "",
        whatsapp: company.whatsapp || "",
        celular: company.celular || "",
        instagram: company.instagram || "",
        cep: company.cep || "",
        pais: company.pais || "Brasil",
        state_id: company.state_id || "",
        city_id: company.city_id || "",
        bairro: company.bairro || "",
        rua: company.rua || "",
        numero: company.numero || "",
        complemento: company.complemento || "",
        privacidade: company.privacidade || "todos",
      });

      // Inicializar estado/cidade
      if (company.state_id) {
        setSelectedStateId(company.state_id);
        if (company.city_id) {
          setSelectedCityId(company.city_id);
        }
      }
    }
  }, [company, form, setSelectedStateId, setSelectedCityId]);

  const onSubmit = async (data: FormValues) => {
    try {
      // Limpa os campos vazios para que sejam enviados como null
      const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
        // Se o valor for uma string vazia, define como null
        acc[key] = value === "" ? null : value;
        return acc;
      }, {} as Record<string, any>);

      if (company) {
        const updated = await updateCompany({
          id: company.id,
          ...cleanedData
        });
        toast.success("Empresa atualizada com sucesso!");
        onSuccess?.(updated);
      } else {
        const created = await createCompany(cleanedData);
        toast.success("Empresa criada com sucesso!");
        onSuccess?.(created);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar empresa:", error);
      toast.error("Erro ao salvar empresa");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 h-full flex flex-col">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <SheetTitle>{company ? "Editar Empresa" : "Nova Empresa"}</SheetTitle>
                  <SheetDescription>
                    {company ? "Atualize os dados da empresa" : "Adicione uma nova empresa ao seu CRM"}
                  </SheetDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto pr-6">
              {/* Dados Básicos */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground border-b pb-2">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Dados Básicos</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          Nome Fantasia *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel className="flex items-center gap-2">
                          <User2 className="w-4 h-4" />
                          Razão Social
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          CNPJ
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            onChange={(e) => {
                              e.target.value = formatCNPJ(e.target.value);
                              field.onChange(e);
                            }}
                            maxLength={18}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4" />
                          Descrição
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contato */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground border-b pb-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Contato</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <AtSign className="w-4 h-4" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
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
                        <FormLabel className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          WhatsApp *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            onChange={(e) => {
                              e.target.value = formatPhone(e.target.value);
                              field.onChange(e);
                            }}
                            maxLength={15}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="celular"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          Celular
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            onChange={(e) => {
                              e.target.value = formatPhone(e.target.value);
                              field.onChange(e);
                            }}
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
                        <FormLabel className="flex items-center gap-2">
                          <Instagram className="w-4 h-4" />
                          Instagram
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground border-b pb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Endereço</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPinned className="w-4 h-4" />
                          CEP
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            onChange={(e) => {
                              e.target.value = formatCEP(e.target.value);
                              field.onChange(e);
                            }}
                            maxLength={9}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Map className="w-4 h-4" />
                          Estado
                        </FormLabel>
                        <Select 
                          value={selectedStateId} 
                          onValueChange={(value) => {
                            setSelectedStateId(value);
                            setSelectedCityId("");
                            field.onChange(value);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingStates ? (
                              <SelectItem value="_loading">Carregando estados...</SelectItem>
                            ) : states?.length === 0 ? (
                              <SelectItem value="_empty">Nenhum estado encontrado</SelectItem>
                            ) : (
                              states?.map((state) => (
                                <SelectItem key={state.id} value={state.id}>
                                  {state.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Navigation className="w-4 h-4" />
                          Cidade
                        </FormLabel>
                        <Select
                          value={selectedCityId}
                          onValueChange={(value) => {
                            setSelectedCityId(value);
                            field.onChange(value);
                          }}
                          disabled={!selectedStateId || isLoadingCities}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma cidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingCities ? (
                              <SelectItem value="_loading">Carregando cidades...</SelectItem>
                            ) : !selectedStateId ? (
                              <SelectItem value="_select_state">Selecione um estado primeiro</SelectItem>
                            ) : cities?.length === 0 ? (
                              <SelectItem value="_empty">Nenhuma cidade encontrada</SelectItem>
                            ) : (
                              cities?.map((city) => (
                                <SelectItem key={city.id} value={city.id}>
                                  {city.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          Bairro
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="rua"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Rua
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          Número
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="complemento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Complemento
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <SheetFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {company ? "Salvar alterações" : "Criar empresa"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

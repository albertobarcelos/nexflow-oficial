import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Building2, UserCircle2, Mail, Share2, FileText, X } from "lucide-react";
import { usePartners } from "@/hooks/usePartners";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { Partner } from "@/types/partner";
import { toast } from "sonner";
import { PartnerAvatar } from "@/components/ui/partner-avatar";
import { PartnerAvatarPicker } from "@/components/ui/partner-avatar-picker";
import { useQueryClient } from "@tanstack/react-query";
import { CompanySelect } from "@/components/ui/company-select"

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

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

const partnerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  whatsapp: z.string().min(1, "WhatsApp é obrigatório"),
  phone: z.string().optional(),
  birth_date: z.date().optional(),
  linkedin: z.string().url("URL do LinkedIn inválida").optional().or(z.literal("")),
  instagram: z.string().optional(),
  partner_type: z.enum(["AFILIADO", "AGENTE_STONE", "CONTADOR"]),
  status: z.enum(["PENDENTE", "ATIVO", "INATIVO", "BLOQUEADO"]).default("PENDENTE"),
  company_id: z.string().optional(),
  role: z.string().optional(),
  description: z.string().optional(),
});

type PartnerForm = z.infer<typeof partnerSchema>;

interface EditPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner & {
    avatar_type?: string;
    avatar_seed?: string | number;
  };
}

export function EditPartnerDialog({ open, onOpenChange, partner }: EditPartnerDialogProps) {
  const { updatePartner } = usePartners();
  const { companies = [] } = useCompanies();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(partner.company_id || "");

  const form = useForm<PartnerForm>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: partner.name,
      email: partner.email,
      whatsapp: partner.whatsapp,
      phone: partner.phone || "",
      birth_date: partner.birth_date ? new Date(partner.birth_date) : undefined,
      linkedin: partner.linkedin || "",
      instagram: partner.instagram || "",
      partner_type: partner.partner_type,
      status: partner.status,
      company_id: partner.company_id || "",
      role: partner.role || "",
      description: partner.description || "",
    },
  });

  // Sincroniza o selectedCompanyId com o form
  useEffect(() => {
    form.setValue("company_id", selectedCompanyId);
  }, [selectedCompanyId, form]);

  const onSubmit = async (data: PartnerForm) => {
    setIsSubmitting(true);
    try {
      // Converte a data para string no formato ISO
      const formattedData = {
        ...data,
        birth_date: data.birth_date ? data.birth_date.toISOString() : undefined,
        company_id: selectedCompanyId
      };

      await updatePartner({
        id: partner.id,
        ...formattedData
      });
      
      toast.success("Parceiro atualizado com sucesso!");
      handleClose();
    } catch (error) {
      console.error("Erro ao atualizar parceiro:", error);
      toast.error("Erro ao atualizar parceiro");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = async (type: string, seed: string | number) => {
    try {
      await updatePartner({
        id: partner.id,
        avatar_type: type,
        avatar_seed: seed,
      });
      
      // Atualiza o estado local do parceiro
      partner.avatar_type = type;
      partner.avatar_seed = seed;
      
      toast.success("Avatar atualizado com sucesso!");
      
      // Força revalidação dos dados
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    } catch (error) {
      console.error("Erro ao atualizar avatar:", error);
      toast.error("Erro ao atualizar avatar");
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const handleCompanySuccess = (company: { id: string; name: string }) => {
    setSelectedCompanyId(company.id);
    form.setValue("company_id", company.id);
  }

  return (
    <Sheet 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <SheetContent 
        className="sm:max-w-[800px] p-0"
        onEscapeKeyDown={handleClose}
        onInteractOutside={handleClose}
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6">
            <div className="flex flex-col items-center text-center pt-8 pb-0">
              <PartnerAvatarPicker
                currentType={partner.avatar_type}
                currentSeed={partner.avatar_seed}
                onSelect={handleAvatarChange}
                className="mb-10"
              />
              <div className="space-y-1">
                <SheetTitle className="text-2xl font-bold">{partner.name}</SheetTitle>
                <SheetDescription className="text-lg text-muted-foreground">
                  Atualize as informações do parceiro
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <Separator className="my-0" />

          <div className="flex-1 overflow-y-auto p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Dados Pessoais */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-2">
                    <UserCircle2 className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">Dados Pessoais</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: João Silva" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="birth_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                locale={ptBR}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contato */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Contato
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
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
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: (11) 99999-9999" {...field} />
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
                            <Input placeholder="Ex: (11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Redes Sociais */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Redes Sociais
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: https://linkedin.com/in/joao-silva" {...field} />
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
                            <Input placeholder="Ex: @joaosilva" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Dados do Parceiro */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Dados do Parceiro
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="partner_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Parceiro</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de parceiro" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="AFILIADO">Afiliado</SelectItem>
                              <SelectItem value="AGENTE_STONE">Agente Stone</SelectItem>
                              <SelectItem value="CONTADOR">Contador</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PENDENTE">Pendente</SelectItem>
                              <SelectItem value="ATIVO">Ativo</SelectItem>
                              <SelectItem value="INATIVO">Inativo</SelectItem>
                              <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <Label>Empresa</Label>
                      <div className="flex gap-2">
                        <CompanySelect 
                          value={selectedCompanyId} 
                          onChange={setSelectedCompanyId}
                          companies={companies}
                          onSuccess={handleCompanySuccess}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Diretor Comercial" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Descrição
                  </h2>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Ex: Parceiro especializado em vendas B2B..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>

          <div className="border-t p-6 bg-background">
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={form.handleSubmit(onSubmit)}
              >
                {isSubmitting ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 
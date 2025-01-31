import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePartners } from "@/hooks/usePartners";
import { Partner } from "@/types/partner";
import { CompanySelect } from "@/components/ui/company-select"; // Import the CompanySelect component
import { Label } from "@/components/ui/label"; // Import the Label component

const editPartnerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  whatsapp: z.string(),
  phone: z.string().optional(),
  description: z.string().optional(),
  company_id: z.string().optional(),
  cargo: z.string().optional(),
  partner_type: z.string(),
  status: z.string(),
  linkedin: z.string().optional(),
  instagram: z.string().optional(),
});

type EditPartnerInput = z.infer<typeof editPartnerSchema>;

interface EditPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner;
}

export function EditPartnerDialog({ open, onOpenChange, partner: initialPartner }: EditPartnerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partner, setPartner] = useState(initialPartner);
  const { updatePartner } = usePartners();

  const form = useForm<EditPartnerInput>({
    resolver: zodResolver(editPartnerSchema),
    defaultValues: {
      name: partner.name || "",
      email: partner.email || "",
      whatsapp: partner.whatsapp || "",
      phone: partner.phone || "",
      description: partner.description || "",
      company_id: partner.company_id || "",
      cargo: partner.cargo || "",
      partner_type: partner.partner_type || "AGENTE_STONE",
      status: partner.status || "ATIVO",
      linkedin: partner.linkedin || "",
      instagram: partner.instagram || "",
    },
  });

  const onSubmit = async (data: EditPartnerInput) => {
    try {
      setIsSubmitting(true);

      console.log("EditPartnerDialog - Partner original:", { 
        id: partner?.id,
        client_id: partner?.client_id,
        company_id: partner?.company_id,
        partner_type: partner?.partner_type,
        status: partner?.status,
      });

      if (!partner?.id || typeof partner.id !== 'string' || partner.id.trim() === '') {
        throw new Error("ID do parceiro inválido");
      }
      
      // Remover campos vazios para evitar problemas com UUID
      const updateData = {
        id: partner.id.trim(),
        name: data.name.trim(),
        email: data.email.trim(),
        whatsapp: data.whatsapp.trim(),
        phone: data.phone?.trim() || null,
        description: data.description?.trim() || null,
        partner_type: data.partner_type,
        status: data.status,
        client_id: partner.client_id,
        company_id: data.company_id,
        cargo: data.cargo,
        linkedin: data.linkedin,
        instagram: data.instagram,
      };

      // Remover campos undefined ou null
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === null) {
          delete updateData[key];
        }
      });

      console.log("EditPartnerDialog - Dados para atualização (antes de enviar):", { 
        updateData,
        hasClientId: !!updateData.client_id,
        hasCompanyId: !!updateData.company_id,
      });

      await updatePartner(updateData);
      onOpenChange(false);
      toast.success("Parceiro atualizado com sucesso!");
    } catch (error: any) {
      console.error("EditPartnerDialog - Erro ao atualizar parceiro:", { 
        error,
        message: error.message,
        details: error.details,
        stack: error.stack,
      });
      toast.error(error.message || "Erro ao atualizar parceiro");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Editar Parceiro</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Atualize as informações do parceiro.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
              {/* Contato */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Contato</h2>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com" {...field} />
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
                          <Input placeholder="(00) 00000-0000" {...field} />
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
                          <Input placeholder="(00) 0000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Redes Sociais */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Redes Sociais</h2>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/in/exemplo" {...field} />
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
                          <Input placeholder="@exemplo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Dados do Parceiro */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Dados do Parceiro</h2>
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
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="AGENTE_STONE">Agente Stone</SelectItem>
                            <SelectItem value="CONSULTOR">Consultor</SelectItem>
                            <SelectItem value="REPRESENTANTE">Representante</SelectItem>
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
                            <SelectItem value="ATIVO">Ativo</SelectItem>
                            <SelectItem value="INATIVO">Inativo</SelectItem>
                            <SelectItem value="PENDENTE">Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company_id"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Empresa</FormLabel>
                        <CompanySelect
                          value={field.value}
                          onChange={(value, company) => {
                            field.onChange(value);
                            setPartner({
                              ...partner,
                              company_id: value,
                              company_name: company?.name,
                              company_razao_social: company?.razao_social,
                              company_cnpj: company?.cnpj
                            });
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cargo"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
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
                <h2 className="text-lg font-semibold">Descrição</h2>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Parceiro especializado em vendas B2B..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter>
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar alterações"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

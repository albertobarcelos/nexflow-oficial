import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Building2, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactToyFace from "react-toy-face";
import { usePartners } from "@/hooks/usePartners";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CompanySelect } from "@/components/ui/company-select";

const partnerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  whatsapp: z.string()
    .min(1, "WhatsApp é obrigatório")
    .regex(/^\(\d{2}\)\s\d{5}-\d{4}$/, "Formato inválido. Use (00) 00000-0000"),
  phone: z.string()
    .regex(/^\(\d{2}\)\s\d{4}-\d{4}$/, "Formato inválido. Use (00) 0000-0000")
    .optional()
    .or(z.literal("")),
  birth_date: z.date().optional(),
  linkedin: z.string()
    .url("URL do LinkedIn inválida")
    .optional()
    .or(z.literal("")),
  instagram: z.string()
    .regex(/^@?[\w](?!.*?\.{2})[\w.]{1,28}[\w]$/, "Nome de usuário do Instagram inválido")
    .optional()
    .or(z.literal("")),
  partner_type: z.enum(["AFILIADO", "AGENTE_STONE", "CONTADOR"], {
    required_error: "Tipo de parceiro é obrigatório",
  }),
  status: z.enum(["PENDENTE", "ATIVO", "INATIVO", "BLOQUEADO"])
    .default("PENDENTE"),
  company_id: z.string().optional(),
  role: z.string().optional(),
  description: z.string().optional(),
});

type PartnerForm = z.infer<typeof partnerSchema>;

const formatPhone = (value: string) => {
  // Remove tudo que não for número
  const numbers = value.replace(/\D/g, "");

  // Formata como (XX) XXXX-XXXX
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return value;
};

const formatWhatsApp = (value: string) => {
  // Remove tudo que não for número
  const numbers = value.replace(/\D/g, "");

  // Formata como (XX) XXXXX-XXXX
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  return value;
};

export function AddPartnerPage() {
  const navigate = useNavigate();
  const { createPartner } = usePartners();
  const { companies } = useCompanies();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toyNumber, setToyNumber] = useState(1); // Número do avatar (1-18)
  const [group, setGroup] = useState(1); // Grupo atual (1 ou 2)

  const form = useForm<PartnerForm>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: "",
      email: "",
      whatsapp: "",
      status: "PENDENTE",
      phone: "",
      linkedin: "",
      instagram: "",
      description: "",
    },
  });

  const handleChangeAvatar = () => {
    // Se chegou ao fim do grupo atual (18)
    if (toyNumber === 18) {
      // Se está no grupo 2, volta para o grupo 1 com número 1
      if (group === 2) {
        setToyNumber(1);
        setGroup(1);
      } else {
        // Se está no grupo 1, vai para o grupo 2 mantendo número 1
        setToyNumber(1);
        setGroup(2);
      }
    } else {
      // Apenas incrementa o número do avatar (sempre entre 1-18)
      setToyNumber((current) => current + 1);
    }
  };

  const onSubmit = async (data: PartnerForm) => {
    setIsSubmitting(true);
    try {
      // Garantir que os campos obrigatórios estejam preenchidos
      if (!data.name || !data.email || !data.whatsapp || !data.partner_type) {
        throw new Error("Campos obrigatórios não preenchidos");
      }

      await createPartner({
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp,
        partner_type: data.partner_type,
        status: data.status,
        phone: data.phone,
        birth_date: data.birth_date,
        linkedin: data.linkedin,
        instagram: data.instagram,
        company_id: data.company_id,
        role: data.role,
        description: data.description,
        avatar_type: "toy_face",
        avatar_seed: `${toyNumber}|${group}`,
      });
      toast.success("Parceiro criado com sucesso!");
      navigate("/crm/partners");
    } catch (error) {
      console.error("Erro ao criar parceiro:", error);
      toast.error("Erro ao criar parceiro");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-6 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Novo Parceiro</h1>
        <Button variant="outline" onClick={() => navigate("/crm/partners")}>
          Cancelar
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-card p-6 rounded-lg shadow-sm">
          {/* Preview do Avatar */}
          <div className="flex flex-col items-center gap-4 pb-6 border-b">
            <div
              className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-white shadow-sm cursor-pointer hover:ring-primary transition-all"
              onClick={handleChangeAvatar}
            >
              <ReactToyFace
                size={96}
                toyNumber={toyNumber}
                rounded={48}
                group={group}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Clique no avatar para alternar entre os{" "}
              {group === 1 ? "primeiros" : "últimos"} 18 estilos (Grupo {group})
            </p>
          </div>

          {/* Dados Pessoais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <h2 className="text-lg font-semibold">Dados Pessoais</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome completo"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Nascimento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
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
            <div className="flex items-center gap-2 pb-2 border-b">
              <h2 className="text-lg font-semibold">Contato</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        className="w-full"
                        {...field}
                      />
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
                        placeholder="(00) 00000-0000"
                        className="w-full"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatWhatsApp(e.target.value);
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
                        placeholder="(00) 0000-0000"
                        className="w-full"
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
            </div>
          </div>

          {/* Redes Sociais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <h2 className="text-lg font-semibold">Redes Sociais</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://linkedin.com/in/usuario"
                        className="w-full"
                        {...field}
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
                      <Input
                        placeholder="@usuario"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Dados do Parceiro */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <h2 className="text-lg font-semibold">Dados do Parceiro</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="partner_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Parceiro</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AFILIADO">Afiliado</SelectItem>
                        <SelectItem value="AGENTE_STONE">
                          Agente Stone
                        </SelectItem>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
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
            </div>
          </div>

          {/* Vínculo com Empresa */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <h2 className="text-lg font-semibold">Vínculo com Empresa</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="company_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <CompanySelect
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Diretor Comercial"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <h2 className="text-lg font-semibold">Observações</h2>
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione observações relevantes sobre o parceiro"
                      className="min-h-[100px] w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-[200px]"
            >
              {isSubmitting ? "Criando..." : "Criar Parceiro"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
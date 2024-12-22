import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collaboratorSchema, type CollaboratorFormData } from "@/lib/validations/collaborator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddCollaboratorFormProps {
  clientId: string;
  onSubmit: (data: CollaboratorFormData & { license_id: string }) => void;
}

const getRolePermissions = (role: string) => {
  switch (role) {
    case "administrator":
      return ["manage_leads", "manage_opportunities", "manage_tasks", "manage_collaborators", "view_reports", "edit_settings"];
    case "closer":
      return ["manage_leads", "manage_opportunities", "manage_tasks"];
    case "partnership_director":
      return ["manage_leads", "manage_opportunities", "manage_tasks", "view_reports"];
    case "partner":
      return ["manage_leads", "view_opportunities"];
    default:
      return [];
  }
};

export function AddCollaboratorForm({ clientId, onSubmit }: AddCollaboratorFormProps) {
  const { toast } = useToast();
  const form = useForm<CollaboratorFormData>({
    resolver: zodResolver(collaboratorSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "closer",
    },
  });

  const { data: license } = useQuery({
    queryKey: ['license', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (data: CollaboratorFormData) => {
    if (!license) {
      toast({
        title: "Erro",
        description: "Licença não encontrada para este cliente.",
        variant: "destructive",
      });
      return;
    }

    try {
      const permissions = getRolePermissions(data.role);
      
      onSubmit({
        ...data,
        license_id: license.id,
      });

      form.reset();
      
      toast({
        title: "Sucesso",
        description: "Colaborador adicionado com sucesso.",
      });
    } catch (error) {
      console.error('Error submitting collaborator:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar colaborador. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="administrator">Administrador</SelectItem>
                  <SelectItem value="closer">Closer</SelectItem>
                  <SelectItem value="partnership_director">Diretor de Parcerias</SelectItem>
                  <SelectItem value="partner">Parceiro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Adicionar</Button>
      </form>
    </Form>
  );
}
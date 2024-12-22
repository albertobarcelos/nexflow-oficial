import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const automationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  trigger: z.string().min(1, "Gatilho é obrigatório"),
  condition: z.string().min(1, "Condição é obrigatória"),
  action: z.string().min(1, "Ação é obrigatória"),
});

type AutomationBuilderProps = {
  onClose: () => void;
};

export function AutomationBuilder({ onClose }: AutomationBuilderProps) {
  const form = useForm<z.infer<typeof automationSchema>>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      name: "",
      trigger: "",
      condition: "",
      action: "",
    },
  });

  const onSubmit = (data: z.infer<typeof automationSchema>) => {
    console.log(data);
    // TODO: Implement automation creation
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Automação</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Follow-up Automático" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trigger"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gatilho</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gatilho" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="lead_created">Lead Criado</SelectItem>
                  <SelectItem value="lead_updated">Lead Atualizado</SelectItem>
                  <SelectItem value="lead_inactive">Lead Inativo</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="condition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Condição</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a condição" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="no_update_7days">
                    Sem atualização por 7 dias
                  </SelectItem>
                  <SelectItem value="status_new">Status: Novo</SelectItem>
                  <SelectItem value="no_tasks">Sem tarefas atribuídas</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="action"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ação</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a ação" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="send_email">Enviar E-mail</SelectItem>
                  <SelectItem value="create_task">Criar Tarefa</SelectItem>
                  <SelectItem value="update_status">Atualizar Status</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Salvar Automação</Button>
        </div>
      </form>
    </Form>
  );
}
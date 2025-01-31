import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCompanyTypes } from "@/features/companies/hooks/useCompanyTypes";
import { CustomCompanyType } from "@/types/database/company";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  color: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CompanyTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: CustomCompanyType;
}

export function CompanyTypeDialog({
  open,
  onOpenChange,
  type,
}: CompanyTypeDialogProps) {
  const { addCompanyType, updateCompanyType } = useCompanyTypes();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#000000",
    },
  });

  useEffect(() => {
    if (type) {
      form.reset({
        name: type.name,
        description: type.description || "",
        color: type.color || "#000000",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        color: "#000000",
      });
    }
  }, [type, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (type) {
        await updateCompanyType.mutateAsync({
          id: type.id,
          ...values,
        });
        toast.success("Tipo de empresa atualizado com sucesso!");
      } else {
        await addCompanyType.mutateAsync(values);
        toast.success("Tipo de empresa criado com sucesso!");
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar tipo:", error);
      toast.error(
        type
          ? "Erro ao atualizar tipo de empresa"
          : "Erro ao criar tipo de empresa"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type ? "Editar tipo de empresa" : "Novo tipo de empresa"}
          </DialogTitle>
          <DialogDescription>
            {type
              ? "Edite as informações do tipo de empresa"
              : "Preencha as informações para criar um novo tipo de empresa"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome" {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Digite uma descrição (opcional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                {type ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFields } from "@/hooks/useFields";
import { CustomFieldValue } from "@/types/database/field";
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
  value: z.string({
    required_error: "Digite um valor",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface EditFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldValue: CustomFieldValue;
  targetId: string;
}

export function EditFieldDialog({
  open,
  onOpenChange,
  fieldValue,
  targetId,
}: EditFieldDialogProps) {
  const { updateFieldValue } = useFields(fieldValue.targetType, targetId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: fieldValue.value,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await updateFieldValue.mutateAsync({
        id: fieldValue.id,
        value: values.value,
      });
      toast.success("Campo personalizado atualizado com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      toast.error("Erro ao atualizar campo personalizado");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {fieldValue.field.name}</DialogTitle>
          <DialogDescription>
            {fieldValue.field.description ||
              "Atualize o valor do campo personalizado"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    {fieldValue.field.type === "text" ? (
                      <Input placeholder="Digite o valor" {...field} />
                    ) : fieldValue.field.type === "textarea" ? (
                      <Textarea placeholder="Digite o valor" {...field} />
                    ) : fieldValue.field.type === "number" ? (
                      <Input
                        type="number"
                        placeholder="Digite o valor"
                        {...field}
                      />
                    ) : fieldValue.field.type === "date" ? (
                      <Input type="date" {...field} />
                    ) : fieldValue.field.type === "url" ? (
                      <Input
                        type="url"
                        placeholder="Digite a URL"
                        {...field}
                      />
                    ) : (
                      <Input placeholder="Digite o valor" {...field} />
                    )}
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
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 

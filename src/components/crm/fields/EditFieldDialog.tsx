import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFields } from "@/hooks/useFields";
import { FieldValue } from "@/types/database/fields";

const editFieldSchema = z.object({
  value: z.string().min(1, "Valor é obrigatório"),
});

type EditFieldInput = z.infer<typeof editFieldSchema>;

interface EditFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldValue: FieldValue;
  targetId: string;
}

export function EditFieldDialog({
  open,
  onOpenChange,
  fieldValue,
  targetId,
}: EditFieldDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateFieldValue } = useFields();

  const form = useForm<EditFieldInput>({
    resolver: zodResolver(editFieldSchema),
    defaultValues: {
      value: fieldValue.value,
    },
  });

  const onSubmit = async (data: EditFieldInput) => {
    try {
      setIsSubmitting(true);
      await updateFieldValue(fieldValue.id, data.value);
      onOpenChange(false);
      toast.success("Campo atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      toast.error("Erro ao atualizar campo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = () => {
    const field = { ...form.register("value") };

    switch (fieldValue.field.type) {
      case "text":
        return <Input {...field} />;
      case "textarea":
        return <Textarea {...field} />;
      case "number":
        return <Input {...field} type="number" />;
      case "date":
        return <Input {...field} type="date" />;
      case "url":
        return <Input {...field} type="url" />;
      default:
        return <Input {...field} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {fieldValue.field.name}</DialogTitle>
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
                    {renderInput()}
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
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 

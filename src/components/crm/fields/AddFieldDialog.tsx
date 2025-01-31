import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFields } from "@/hooks/useFields";

const addFieldSchema = z.object({
  fieldId: z.string().min(1, "Campo é obrigatório"),
  value: z.string().min(1, "Valor é obrigatório"),
});

type AddFieldInput = z.infer<typeof addFieldSchema>;

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  targetType: "company" | "person" | "partner";
}

export function AddFieldDialog({ open, onOpenChange, targetId, targetType }: AddFieldDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fieldDefinitions, addFieldValue } = useFields(targetType);

  const form = useForm<AddFieldInput>({
    resolver: zodResolver(addFieldSchema),
    defaultValues: {
      fieldId: "",
      value: "",
    },
  });

  const onSubmit = async (data: AddFieldInput) => {
    try {
      setIsSubmitting(true);
      await addFieldValue(targetId, data.fieldId, data.value);
      form.reset();
      onOpenChange(false);
      toast.success("Campo adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar campo:", error);
      toast.error("Erro ao adicionar campo");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Campo</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fieldId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um campo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fieldDefinitions.map((definition) => (
                        <SelectItem key={definition.id} value={definition.id}>
                          {definition.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Valor do campo" />
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
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFields } from "@/hooks/useFields";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const formSchema = z.object({
  fieldId: z.string({
    required_error: "Selecione um campo",
  }),
  value: z.string({
    required_error: "Digite um valor",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  targetType: "company" | "person" | "partner";
}

export function AddFieldDialog({
  open,
  onOpenChange,
  targetId,
  targetType,
}: AddFieldDialogProps) {
  const [selectedFieldType, setSelectedFieldType] = useState<string>("");
  const { addFieldValue, availableFields } = useFields(targetType, targetId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fieldId: "",
      value: "",
    },
  });

  useEffect(() => {
    const selectedField = availableFields?.find(
      (field) => field.id === form.getValues().fieldId
    );
    if (selectedField) {
      setSelectedFieldType(selectedField.type);
    }
  }, [form.watch("fieldId"), availableFields]);

  const onSubmit = async (values: FormValues) => {
    try {
      await addFieldValue.mutateAsync({
        targetId,
        targetType,
        fieldId: values.fieldId,
        value: values.value,
      });
      toast.success("Campo personalizado adicionado com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao adicionar campo:", error);
      toast.error("Erro ao adicionar campo personalizado");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar campo personalizado</DialogTitle>
          <DialogDescription>
            Selecione um campo e preencha seu valor
          </DialogDescription>
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      const selectedField = availableFields?.find(
                        (f) => f.id === value
                      );
                      if (selectedField) {
                        setSelectedFieldType(selectedField.type);
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um campo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableFields?.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name}
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
                    {selectedFieldType === "text" ? (
                      <Input placeholder="Digite o valor" {...field} />
                    ) : selectedFieldType === "textarea" ? (
                      <Textarea placeholder="Digite o valor" {...field} />
                    ) : selectedFieldType === "number" ? (
                      <Input
                        type="number"
                        placeholder="Digite o valor"
                        {...field}
                      />
                    ) : selectedFieldType === "date" ? (
                      <Input type="date" {...field} />
                    ) : selectedFieldType === "url" ? (
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
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 

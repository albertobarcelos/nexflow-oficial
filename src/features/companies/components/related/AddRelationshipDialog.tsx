import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCompanyRelationships } from "@/features/companies/hooks/useCompanyRelationships";
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
import { toast } from "sonner";

const formSchema = z.object({
  entityType: z.enum(["person", "partner"], {
    required_error: "Selecione o tipo de relacionamento",
  }),
  entityId: z.string({
    required_error: "Selecione uma entidade",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddRelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export function AddRelationshipDialog({
  open,
  onOpenChange,
  companyId,
}: AddRelationshipDialogProps) {
  const [selectedType, setSelectedType] = useState<"person" | "partner">("person");
  const { addRelationship, availablePeople, availablePartners } =
    useCompanyRelationships(companyId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entityType: "person",
      entityId: "",
    },
  });

  useEffect(() => {
    form.reset({
      entityType: selectedType,
      entityId: "",
    });
  }, [selectedType, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await addRelationship.mutateAsync({
        companyId,
        entityType: values.entityType,
        entityId: values.entityId,
      });
      toast.success("Relacionamento adicionado com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao adicionar relacionamento:", error);
      toast.error("Erro ao adicionar relacionamento");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar relacionamento</DialogTitle>
          <DialogDescription>
            Selecione o tipo de relacionamento e a entidade para adicionar
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="entityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de relacionamento</FormLabel>
                  <Select
                    onValueChange={(value: "person" | "partner") => {
                      field.onChange(value);
                      setSelectedType(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="person">Pessoa</SelectItem>
                      <SelectItem value="partner">Parceiro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="entityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {selectedType === "person" ? "Pessoa" : "Parceiro"}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={`Selecione ${
                            selectedType === "person" ? "uma pessoa" : "um parceiro"
                          }`}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedType === "person"
                        ? availablePeople?.map((person) => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.name}
                            </SelectItem>
                          ))
                        : availablePartners?.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              {partner.name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
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

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useCreateContact } from "@/hooks/useCreateContact";

// Schema de validação: nome e telefone obrigatórios
const addContactSchema = z.object({
  client_name: z.string().min(1, "Nome é obrigatório").trim(),
  phone_numbers: z.string().min(1, "Telefone é obrigatório").trim(),
});

type AddContactFormData = z.infer<typeof addContactSchema>;

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog para adicionar novo contato com campos nome e telefone.
 * Utiliza o hook useCreateContact que insere direto na tabela contacts.
 */
export function AddContactDialog({
  open,
  onOpenChange,
}: AddContactDialogProps) {
  const { mutateAsync: createContact, isPending: isCreating } =
    useCreateContact();

  const form = useForm<AddContactFormData>({
    resolver: zodResolver(addContactSchema),
    defaultValues: {
      client_name: "",
      phone_numbers: "",
    },
  });

  const handleSubmit = async (data: AddContactFormData) => {
    try {
      await createContact({
        client_name: data.client_name.trim(),
        main_contact: data.client_name.trim(),
        phone_numbers: [data.phone_numbers.trim()],
      });
      form.reset();
      onOpenChange(false);
    } catch {
      // Erro já tratado no hook useCreateContact
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar novo contato</DialogTitle>
          <DialogDescription>
            Preencha os campos para cadastrar um novo contato
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Digite o nome do contato"
                      disabled={isCreating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone_numbers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de telefone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Digite o número de telefone"
                      disabled={isCreating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  "Adicionar"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

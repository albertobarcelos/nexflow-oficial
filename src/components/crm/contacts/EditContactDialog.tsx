import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useUpdateContact } from "@/hooks/useUpdateContact";

/** Contato mínimo necessário para edição */
export interface ContactForEdit {
  id: string;
  client_name: string;
  main_contact?: string | null;
  phone_numbers?: string[] | null;
  company_names?: string[] | null;
  tax_ids?: string[] | null;
}

const editContactSchema = z.object({
  client_name: z.string().min(1, "Nome é obrigatório").trim(),
  main_contact: z.string().trim(),
  phone_numbers_raw: z.string(),
  company_names_raw: z.string(),
  tax_ids_raw: z.string(),
});

type EditContactFormData = z.infer<typeof editContactSchema>;

function rawToArray(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactForEdit | null;
}

/**
 * Dialog para editar contato existente.
 * Campos: nome, contato principal, telefones (um por linha), empresas (um por linha), CPF/CNPJ (um por linha).
 */
export function EditContactDialog({
  open,
  onOpenChange,
  contact,
}: EditContactDialogProps) {
  const { mutateAsync: updateContact, isPending: isUpdating } =
    useUpdateContact();

  const form = useForm<EditContactFormData>({
    resolver: zodResolver(editContactSchema),
    defaultValues: {
      client_name: "",
      main_contact: "",
      phone_numbers_raw: "",
      company_names_raw: "",
      tax_ids_raw: "",
    },
  });

  // Preencher formulário quando o contato ou a abertura do dialog mudar
  useEffect(() => {
    if (open && contact) {
      form.reset({
        client_name: contact.client_name ?? "",
        main_contact: contact.main_contact ?? "",
        phone_numbers_raw: (contact.phone_numbers ?? []).join("\n"),
        company_names_raw: (contact.company_names ?? []).join("\n"),
        tax_ids_raw: (contact.tax_ids ?? []).join("\n"),
      });
    }
  }, [open, contact, form]);

  const handleSubmit = async (data: EditContactFormData) => {
    if (!contact) return;
    try {
      await updateContact({
        contactId: contact.id,
        client_name: data.client_name,
        main_contact: data.main_contact || data.client_name,
        phone_numbers: rawToArray(data.phone_numbers_raw),
        company_names: rawToArray(data.company_names_raw),
        tax_ids: rawToArray(data.tax_ids_raw),
      });
      onOpenChange(false);
    } catch {
      // Erro já tratado no hook useUpdateContact
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar contato</DialogTitle>
          <DialogDescription>
            Altere os dados do contato e salve
          </DialogDescription>
        </DialogHeader>

        {contact ? (
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
                        placeholder="Nome do contato"
                        disabled={isUpdating}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="main_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato principal</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nome da pessoa de contato"
                        disabled={isUpdating}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone_numbers_raw"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefones (um por linha)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Um número por linha"
                        rows={3}
                        disabled={isUpdating}
                        className="resize-none font-mono text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_names_raw"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresas (uma por linha)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Um nome por linha"
                        rows={3}
                        disabled={isUpdating}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax_ids_raw"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ (um por linha)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Um documento por linha"
                        rows={2}
                        disabled={isUpdating}
                        className="resize-none font-mono text-sm"
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
                  disabled={isUpdating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            Nenhum contato selecionado para edição.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

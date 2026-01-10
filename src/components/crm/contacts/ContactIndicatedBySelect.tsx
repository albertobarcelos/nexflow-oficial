import { useState } from "react";
import { useContactsForSelect } from "@/hooks/useContactsForSelect";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, X, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ContactIndicatedBySelectProps {
  contactId: string | null;
  currentIndicatedBy: string | null;
  onUpdate?: () => void;
}

export function ContactIndicatedBySelect({
  contactId,
  currentIndicatedBy,
  onUpdate,
}: ContactIndicatedBySelectProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: contacts = [], isLoading } = useContactsForSelect(contactId);

  const selectedContact = contacts.find((c) => c.id === currentIndicatedBy);

  const updateIndicatedBy = useMutation({
    mutationFn: async (indicatedById: string | null) => {
      if (!contactId) throw new Error("Contact ID é obrigatório");

      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      const { error } = await nexflowClient()
        .from("contacts")
        .update({ indicated_by: indicatedById })
        .eq("id", contactId)
        .eq("client_id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-details", contactId] });
      queryClient.invalidateQueries({ queryKey: ["contacts-for-select"] });
      toast.success("Parceiro indicador atualizado com sucesso!");
      onUpdate?.();
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar parceiro indicador:", error);
      toast.error(error.message || "Erro ao atualizar parceiro indicador");
    },
  });

  const handleSelect = (contactId: string | null) => {
    updateIndicatedBy.mutate(contactId);
    setOpen(false);
  };

  const handleClear = () => {
    updateIndicatedBy.mutate(null);
  };

  if (!contactId) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="indicated-by">Parceiro Indicador</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={isLoading || updateIndicatedBy.isPending}
            >
              {isLoading || updateIndicatedBy.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Carregando...</span>
                </div>
              ) : selectedContact ? (
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate">{selectedContact.client_name}</span>
                  {selectedContact.phone_numbers && selectedContact.phone_numbers.length > 0 && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      ({selectedContact.phone_numbers[0]})
                    </span>
                  )}
                  {selectedContact.contact_type === "parceiro" && (
                    <span className="text-xs text-muted-foreground shrink-0">(Parceiro)</span>
                  )}
                </div>
              ) : (
                <span className="truncate">Selecione um parceiro indicador</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0" align="start" sideOffset={4}>
            <Command>
              <CommandInput placeholder="Buscar contato..." className="h-9" />
              <CommandEmpty>Nenhum contato encontrado.</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-y-auto">
                <CommandItem
                  value="none"
                  onSelect={() => handleSelect(null)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !currentIndicatedBy ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Nenhum
                </CommandItem>
                {contacts.map((contact) => (
                  <CommandItem
                    key={contact.id}
                    value={contact.client_name}
                    onSelect={() => handleSelect(contact.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentIndicatedBy === contact.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="h-4 w-4 shrink-0" />
                      <span className="truncate flex-1 min-w-0">{contact.client_name}</span>
                      {contact.main_contact && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({contact.main_contact})
                        </span>
                      )}
                      {contact.contact_type === "parceiro" && (
                        <span className="text-xs text-primary shrink-0">Parceiro</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        {currentIndicatedBy && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={updateIndicatedBy.isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {selectedContact && (
        <p className="text-xs text-muted-foreground">
          Este contato foi indicado por {selectedContact.client_name}
        </p>
      )}
    </div>
  );
}


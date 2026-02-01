import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useContactsForSelect, type ContactForSelect } from "@/hooks/useContactsForSelect";
import {
  useCardContacts,
  useCardContactsMutations,
} from "../hooks/useCardContacts";
import type { NexflowCard } from "@/types/nexflow";

interface CardContactsTabProps {
  card: NexflowCard;
}

/**
 * Tab de contatos do card: lista contatos vinculados e permite adicionar/remover.
 * Contatos disponíveis vêm da tabela contacts filtrada por client_id.
 * Múltiplos contatos exigem a tabela card_contacts no banco (ver docs/card_contacts_and_company_sql.md).
 */
export function CardContactsTab({ card }: CardContactsTabProps) {
  const [open, setOpen] = useState(false);
  const { data: contactIds = [], isLoading: isLoadingContacts } = useCardContacts(
    card.id,
    card
  );
  const { data: contactsList = [], isLoading: isLoadingAll } = useContactsForSelect();
  const { addContact, removeContact } = useCardContactsMutations({
    cardId: card.id,
    flowId: card.flowId,
  });

  const assignedContacts = contactsList.filter((c) => contactIds.includes(c.id));
  const availableToAdd = contactsList.filter((c) => !contactIds.includes(c.id));

  const displayName = (c: ContactForSelect) =>
    c.main_contact?.trim() || c.client_name || c.id;

  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">
        Contatos do card
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Vincule contatos ao card. Apenas contatos do seu cliente estão disponíveis.
      </p>

      {isLoadingContacts ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando contatos...</span>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Contatos vinculados
            </label>
            {assignedContacts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
                Nenhum contato vinculado. Adicione um contato abaixo.
              </p>
            ) : (
              <ul className="space-y-2">
                {assignedContacts.map((contact) => (
                  <li
                    key={contact.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {displayName(contact)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-slate-500 hover:text-red-600"
                      onClick={() => removeContact.mutate(contact.id)}
                      disabled={removeContact.isPending}
                      aria-label={`Remover ${displayName(contact)}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between sm:w-auto"
                  disabled={isLoadingAll || availableToAdd.length === 0}
                >
                  {isLoadingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar contato
                    </>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar contato..." />
                  <CommandEmpty>Nenhum contato encontrado.</CommandEmpty>
                  <CommandGroup>
                    {availableToAdd.map((contact) => (
                      <CommandItem
                        key={contact.id}
                        value={`${contact.main_contact ?? ""} ${contact.client_name ?? ""}`}
                        onSelect={() => {
                          addContact.mutate(contact.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            contactIds.includes(contact.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {displayName(contact)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}
    </div>
  );
}

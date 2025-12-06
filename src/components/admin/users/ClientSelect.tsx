import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOrganizationCompanies } from "@/hooks/useOrganizationCompanies";

interface ClientSelectProps {
  value?: string;
  onChange: (value: string) => void;
}

export function ClientSelect({ value, onChange }: ClientSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: clients = [], isLoading } = useOrganizationCompanies();

  // Usar company_name ou name como fallback
  const selectedClient = clients.find((client) => client.id === value);
  const getClientDisplayName = (client: typeof clients[0]) => {
    return client.company_name || client.name || "Sem nome";
  };

  // Filtrar clientes baseado na busca e limitar a 5 itens visíveis
  const filteredClients = clients.filter((client) => {
    const displayName = getClientDisplayName(client).toLowerCase();
    return displayName.includes(searchQuery.toLowerCase());
  });
  const displayedClients = filteredClients.slice(0, 5);

  return (
    <Popover open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        setSearchQuery("");
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {value && selectedClient
            ? getClientDisplayName(selectedClient)
            : "Selecione um cliente/empresa"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Buscar cliente/empresa..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            {isLoading ? "Carregando..." : "Nenhum cliente encontrado."}
          </CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            {displayedClients.map((client) => (
              <CommandItem
                key={client.id}
                value={getClientDisplayName(client)}
                onSelect={() => {
                  onChange(client.id);
                  setOpen(false);
                  setSearchQuery("");
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === client.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {getClientDisplayName(client)}
              </CommandItem>
            ))}
            {filteredClients.length > 5 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Mostrando 5 de {filteredClients.length} resultados. Use a busca para filtrar.
              </div>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


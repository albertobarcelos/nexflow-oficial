import { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

interface ClientSearchSelectProps {
  value?: string;
  onChange: (value: string) => void;
}

interface Client {
  id: string;
  name: string;
  company_name: string | null;
}

export function ClientSearchSelect({ value, onChange }: ClientSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar clientes com base na query de busca
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) {
        return [];
      }

      try {
        // Buscar clientes pelo nome ou company_name usando ilike
        const { data, error } = await supabase
          .from("core_clients")
          .select("id, name, company_name")
          .or(`name.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%`)
          .limit(5);

        if (error) {
          console.error("Erro ao buscar clientes:", error);
          return [];
        }

        return (data || []) as Client[];
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        return [];
      }
    },
    enabled: open && searchQuery.trim().length > 0,
  });

  // Buscar cliente selecionado para exibir o nome
  const { data: selectedClient } = useQuery({
    queryKey: ["client", value],
    queryFn: async () => {
      if (!value) return null;

      try {
        const { data, error } = await supabase
          .from("core_clients")
          .select("id, name, company_name")
          .eq("id", value)
          .single();

        if (error) {
          console.error("Erro ao buscar cliente selecionado:", error);
          return null;
        }

        return data as Client;
      } catch (error) {
        console.error("Erro ao buscar cliente selecionado:", error);
        return null;
      }
    },
    enabled: !!value,
  });

  const getClientDisplayName = (client: Client | null) => {
    if (!client) return "Selecione um cliente/empresa";
    return client.company_name || client.name || "Sem nome";
  };

  return (
    <Popover
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          setSearchQuery("");
        }
      }}
    >
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
            {isLoading
              ? "Carregando..."
              : searchQuery.trim().length === 0
              ? "Digite para buscar clientes..."
              : "Nenhum cliente encontrado."}
          </CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            {clients.map((client) => (
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
            {clients.length === 5 && searchQuery.trim().length > 0 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Mostrando 5 resultados. Refine a busca para mais opções.
              </div>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


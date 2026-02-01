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
import { useOrganizationLicenses } from "@/hooks/useOrganizationLicenses";

interface LicenseSelectProps {
  value?: string;
  onChange: (value: string | undefined) => void;
}

export function LicenseSelect({ value, onChange }: LicenseSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: licenses = [], isLoading } = useOrganizationLicenses();

  const selectedLicense = licenses.find((license) => license.id === value);

  // Filtrar licenças baseado na busca e limitar a 5 itens visíveis
  const filteredLicenses = licenses.filter((license) => {
    const displayName = license.name.toLowerCase();
    return displayName.includes(searchQuery.toLowerCase());
  });
  const displayedLicenses = filteredLicenses.slice(0, 5);

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
          {value && selectedLicense
            ? `${selectedLicense.name} (${selectedLicense.user_quantity} usuários)`
            : "Selecione uma licença (opcional)"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Buscar licença..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            {isLoading ? "Carregando..." : "Nenhuma licença encontrada."}
          </CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            <CommandItem
              value="none"
              onSelect={() => {
                onChange(undefined);
                setOpen(false);
                setSearchQuery("");
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  !value ? "opacity-100" : "opacity-0"
                )}
              />
              Nenhuma licença
            </CommandItem>
            {displayedLicenses.map((license) => (
              <CommandItem
                key={license.id}
                value={license.name}
                onSelect={() => {
                  onChange(license.id);
                  setOpen(false);
                  setSearchQuery("");
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === license.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{license.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {license.user_quantity} usuário{license.user_quantity !== 1 ? "s" : ""}
                  </span>
                </div>
              </CommandItem>
            ))}
            {filteredLicenses.length > 5 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Mostrando 5 de {filteredLicenses.length} resultados. Use a busca para filtrar.
              </div>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

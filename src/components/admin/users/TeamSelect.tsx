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
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";

interface TeamSelectProps {
  value?: string;
  onChange: (value: string) => void;
}

export function TeamSelect({ value, onChange }: TeamSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: teams = [], isLoading } = useOrganizationTeams();

  const selectedTeam = teams.find((team) => team.id === value);

  // Filtrar times baseado na busca e limitar a 5 itens visíveis
  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const displayedTeams = filteredTeams.slice(0, 5);

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
          {value && selectedTeam
            ? selectedTeam.name
            : "Selecione um time"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Buscar time..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            {isLoading ? "Carregando..." : "Nenhum time encontrado."}
          </CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            {displayedTeams.map((team) => (
              <CommandItem
                key={team.id}
                value={team.name}
                onSelect={() => {
                  onChange(team.id);
                  setOpen(false);
                  setSearchQuery("");
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === team.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {team.name}
              </CommandItem>
            ))}
            {filteredTeams.length > 5 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Mostrando 5 de {filteredTeams.length} resultados. Use a busca para filtrar.
              </div>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


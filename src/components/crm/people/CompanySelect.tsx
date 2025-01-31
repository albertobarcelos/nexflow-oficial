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
import { useCompanies } from "@/features/companies/hooks/useCompanies";

interface CompanySelectProps {
  value?: string;
  onChange: (value: string) => void;
}

export function CompanySelect({ value, onChange }: CompanySelectProps) {
  const [open, setOpen] = useState(false);
  const { companies } = useCompanies();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? companies?.find((company) => company.id === value)?.name
            : "Selecione uma empresa"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Buscar empresa..." />
          <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
          <CommandGroup>
            {companies?.map((company) => (
              <CommandItem
                key={company.id}
                value={company.name}
                onSelect={() => {
                  onChange(company.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === company.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {company.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

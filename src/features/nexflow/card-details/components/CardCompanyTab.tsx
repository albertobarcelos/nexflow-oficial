import { useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { useUpdateCardCompany } from "../hooks/useUpdateCardCompany";
import type { NexflowCard } from "@/types/nexflow";

interface CardCompanyTabProps {
  card: NexflowCard;
}

/**
 * Tab Empresa do card: permite selecionar uma empresa (web_companies) para vincular ao card.
 * Requer a coluna company_id na tabela cards (ver docs/card_contacts_and_company_sql.md).
 */
export function CardCompanyTab({ card }: CardCompanyTabProps) {
  const [open, setOpen] = useState(false);
  const { companies = [], isLoading: isLoadingCompanies } = useCompanies();
  const updateCompany = useUpdateCardCompany(card.id, card.flowId);

  const companyId = card.companyId ?? null;
  const selectedCompany = companies.find((c) => c.id === companyId);

  const handleSelect = (id: string | null) => {
    updateCompany.mutate(id ?? null);
    setOpen(false);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-xl font-bold text-slate-800 ">
        Empresa do card
      </h2>
      <p className="text-sm text-slate-500 ">
        Selecione uma empresa (web_companies) para vincular a este card.
      </p>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400  uppercase tracking-wider">
          Empresa vinculada
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={isLoadingCompanies || updateCompany.isPending}
            >
              {isLoadingCompanies ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Carregando...</span>
                </div>
              ) : selectedCompany ? (
                selectedCompany.name
              ) : (
                "Nenhuma empresa selecionada"
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar empresa..." />
              <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="nenhuma"
                  onSelect={() => handleSelect(null)}
                >
                  <Check className={cn("mr-2 h-4 w-4", !companyId ? "opacity-100" : "opacity-0")} />
                  Nenhuma
                </CommandItem>
                {companies.map((company) => (
                  <CommandItem
                    key={company.id}
                    value={company.name}
                    onSelect={() => handleSelect(company.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        companyId === company.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {company.name}
                    {company.cnpj && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({company.cnpj})
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

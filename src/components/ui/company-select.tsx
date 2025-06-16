import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CompanyQuickForm } from "./company-quick-form";

interface CompanySelectProps {
  value?: string;
  onChange?: (value: string, company?: { id: string; name: string; razao_social?: string | null; cnpj?: string | null }) => void;
}

export function CompanySelect({ value, onChange }: CompanySelectProps) {
  const { companies = [], isLoading } = useCompanies();
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCompany = companies?.find(company => company.id === value);

  const handleCompanyCreated = (company: { id: string; name: string }) => {
    onChange?.(company.id, company);
    setDialogOpen(false);
    setSearch("");
  };

  const handleSelect = (company: { id: string; name: string; razao_social?: string | null; cnpj?: string | null }) => {
    onChange?.(company.id, company);
    setOpen(false);
  };

  const filteredCompanies = companies?.filter(company => 
    company.name.toLowerCase().includes(search.toLowerCase()) ||
    (company.cnpj && company.cnpj.includes(search))
  ) || [];

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando...</span>
              </div>
            ) : value
              ? selectedCompany?.name
              : "Selecione uma empresa"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput 
              placeholder="Buscar empresa..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Nenhuma empresa encontrada
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDialogOpen(true);
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Nova Empresa
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredCompanies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={company.name}
                  onSelect={() => handleSelect(company)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === company.id ? "opacity-100" : "opacity-0"
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
          </DialogHeader>
          <CompanyQuickForm
            onSuccess={handleCompanyCreated}
            initialName={search}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
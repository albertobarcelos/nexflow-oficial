import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { Building, Check, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CompanyQuickDialog } from "./CompanyQuickDialog";

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
          ) : selectedCompany ? (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <div className="flex-1 text-left">
                <p>{selectedCompany.name}</p>
                {selectedCompany.razao_social && (
                  <p className="text-sm text-muted-foreground">{selectedCompany.razao_social}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Buscar empresa...</div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Buscar empresa..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <CommandEmpty className="py-6">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada.</p>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Nova Empresa
                    </Button>
                  </div>
                </CommandEmpty>
                {filteredCompanies.length > 0 && (
                  <>
                    <CommandGroup>
                      {filteredCompanies.map(company => (
                        <CommandItem
                          key={company.id}
                          value={company.name}
                          onSelect={() => handleSelect(company)}
                          className="flex items-center gap-2"
                        >
                          <Check
                            className={cn(
                              "h-4 w-4",
                              value === company.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <Building className="h-4 w-4 shrink-0" />
                          <div className="flex-1">
                            <p>{company.name}</p>
                            <div className="text-sm text-muted-foreground">
                              {company.razao_social && (
                                <p>{company.razao_social}</p>
                              )}
                              {company.cnpj && (
                                <p>{company.cnpj}</p>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => setDialogOpen(true)}
                        className="justify-center text-muted-foreground"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Nova Empresa
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>

      <CompanyQuickDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCompanyCreated={handleCompanyCreated}
        initialName={search}
      />
    </Popover>
  );
}
import { useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface FunnelFiltersProps {
  onFilterChange: (filters: any) => void;
}

export function FunnelFilters({ onFilterChange }: FunnelFiltersProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [filters, setFilters] = useState({
    showOnlyContactsWithoutDeals: false,
    searchTerm: "",
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div
      className={cn(
        "h-full bg-gray-50 border-r transition-all duration-300 flex flex-col",
        isOpen ? "w-[300px]" : "w-[50px]"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        {isOpen ? (
          <>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filtros</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(true)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filtros */}
      {isOpen && (
        <div className="p-4 space-y-6">
          {/* Busca */}
          <div className="space-y-2">
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-9"
                value={filters.searchTerm}
                onChange={(e) =>
                  handleFilterChange("searchTerm", e.target.value)
                }
              />
              {filters.searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => handleFilterChange("searchTerm", "")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Switch para mostrar apenas contatos sem negócios */}
          <div className="flex items-center space-x-2">
            <Switch
              id="show-only-contacts"
              checked={filters.showOnlyContactsWithoutDeals}
              onCheckedChange={(checked) =>
                handleFilterChange("showOnlyContactsWithoutDeals", checked)
              }
            />
            <Label htmlFor="show-only-contacts">
              Mostrar apenas contatos sem negócios
            </Label>
          </div>
        </div>
      )}
    </div>
  );
} 
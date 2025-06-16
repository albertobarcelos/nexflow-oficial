import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, Search } from "lucide-react";

interface FlowFiltersProps {
  onFilterChange: (filters: any) => void;
}

export function FlowFilters({ onFilterChange }: FlowFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFilterChange({ searchTerm: value });
  };

  return (
    <div className="w-[300px] h-full bg-white border-r border-r-slate-100 p-4">
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Filtros</h3>
        
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Buscar negócios..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Outros filtros podem ser adicionados aqui */}
        <Button variant="outline" className="w-full justify-start">
          <Filter className="mr-2 h-4 w-4" />
          Mais filtros
        </Button>
      </div>
    </div>
  );
} 
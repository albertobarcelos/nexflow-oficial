import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FilterPopover } from "./FilterPopover";

interface EntityTableHeaderProps {
  entityName: string;
  fields: any[];
  filters: Record<string, any>;
  activeFilters: string[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (fieldId: string, value: string) => void;
  onClearFilter: (fieldId: string) => void;
}

export function EntityTableHeader({
  entityName,
  fields,
  filters,
  activeFilters,
  searchTerm,
  onSearchChange,
  onFilterChange,
  onClearFilter,
}: EntityTableHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2 flex-1 min-w-[280px]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${entityName.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <FilterPopover
          fields={fields}
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
          onClearFilter={onClearFilter}
        >
          <Button 
            variant="outline" 
            size="icon"
            className={cn(
              "relative",
              activeFilters.length > 0 && "border-primary"
            )}
          >
            <Filter className="h-4 w-4" />
            {activeFilters.length > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
              >
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        </FilterPopover>
      </div>
    </div>
  );
}
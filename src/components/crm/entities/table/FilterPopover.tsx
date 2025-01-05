import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FilterPopoverProps {
  children: React.ReactNode;
  fields: any[];
  filters: Record<string, any>;
  activeFilters: string[];
  onFilterChange: (fieldId: string, value: string) => void;
  onClearFilter: (fieldId: string) => void;
}

export function FilterPopover({
  children,
  fields,
  filters,
  onFilterChange,
  onClearFilter,
}: FilterPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Filtros</h4>
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id} className="flex items-center justify-between">
                {field.name}
                {filters[field.id] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => onClearFilter(field.id)}
                  >
                    Limpar
                  </Button>
                )}
              </Label>
              <Input
                id={field.id}
                value={filters[field.id] || ""}
                onChange={(e) => onFilterChange(field.id, e.target.value)}
                placeholder={`Filtrar por ${field.name.toLowerCase()}`}
                className={cn(
                  filters[field.id] && "border-primary"
                )}
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
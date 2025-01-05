import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface EntityRecordsTableProps {
  entityName: string;
  fields: any[];
  records: any[];
  isLoading?: boolean;
  onFilter?: (filters: Record<string, any>) => void;
}

export function EntityRecordsTable({
  entityName,
  fields,
  records = [],
  isLoading,
  onFilter,
}: EntityRecordsTableProps) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 45,
    overscan: 10,
  });

  useEffect(() => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    onFilter?.(newFilters);
  }, [searchTerm]);

  const handleFilterChange = (fieldId: string, value: any) => {
    const newFilters = { ...filters, [fieldId]: value };
    setFilters(newFilters);
    setActiveFilters(Object.entries(newFilters)
      .filter(([key, value]) => value && key !== 'search')
      .map(([key]) => key));
    onFilter?.(newFilters);
  };

  const clearFilter = (fieldId: string) => {
    const { [fieldId]: removed, ...newFilters } = filters;
    setFilters(newFilters);
    setActiveFilters(activeFilters.filter(id => id !== fieldId));
    onFilter?.(newFilters);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar ${entityName.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
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
                          onClick={() => clearFilter(field.id)}
                        >
                          Limpar
                        </Button>
                      )}
                    </Label>
                    <Input
                      id={field.id}
                      value={filters[field.id] || ""}
                      onChange={(e) => handleFilterChange(field.id, e.target.value)}
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
        </div>
      </div>

      <div
        ref={tableContainerRef}
        className="border rounded-md relative"
        style={{ height: "600px", overflow: "auto" }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {fields.map((field) => (
                <TableHead 
                  key={field.id}
                  className={cn(
                    "transition-colors",
                    filters[field.id] && "text-primary"
                  )}
                >
                  {field.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={fields.length} className="h-24 text-center">
                  <div className="flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Carregando registros...
                  </div>
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={fields.length} className="h-24 text-center text-muted-foreground">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const record = records[virtualRow.index];
                return (
                  <TableRow
                    key={virtualRow.index}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className="animate-fade-in"
                  >
                    {fields.map((field) => (
                      <TableCell 
                        key={field.id}
                        className={cn(
                          "transition-colors",
                          filters[field.id] && record[field.name]?.toString().toLowerCase().includes(filters[field.id].toLowerCase()) && 
                          "bg-primary/5"
                        )}
                      >
                        {record[field.name] || "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
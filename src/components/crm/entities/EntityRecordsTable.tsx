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
import { Search, Filter } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Configuração do virtualizador
  const rowVirtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 45, // altura estimada de cada linha
    overscan: 10,
  });

  // Atualizar filtros quando o termo de busca mudar
  useEffect(() => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    onFilter?.(newFilters);
  }, [searchTerm]);

  const handleFilterChange = (fieldId: string, value: any) => {
    const newFilters = { ...filters, [fieldId]: value };
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
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
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Filtros</h4>
                {fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>{field.name}</Label>
                    <Input
                      id={field.id}
                      value={filters[field.id] || ""}
                      onChange={(e) => handleFilterChange(field.id, e.target.value)}
                      placeholder={`Filtrar por ${field.name.toLowerCase()}`}
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
        className="border rounded-md"
        style={{ height: "600px", overflow: "auto" }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {fields.map((field) => (
                <TableHead key={field.id}>{field.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const record = records[virtualRow.index];
              return (
                <TableRow
                  key={virtualRow.index}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                >
                  {fields.map((field) => (
                    <TableCell key={field.id}>
                      {record[field.name] || "-"}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
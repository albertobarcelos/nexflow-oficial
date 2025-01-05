import { useRef, useState, useEffect } from "react";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EntityTableHeader } from "./table/EntityTableHeader";
import { EntityTableBody } from "./table/EntityTableBody";

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
      <EntityTableHeader
        entityName={entityName}
        fields={fields}
        filters={filters}
        activeFilters={activeFilters}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFilterChange={handleFilterChange}
        onClearFilter={clearFilter}
      />

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
          
          <EntityTableBody
            containerRef={tableContainerRef}
            records={records}
            fields={fields}
            filters={filters}
            isLoading={isLoading}
          />
        </Table>
      </div>
    </div>
  );
}
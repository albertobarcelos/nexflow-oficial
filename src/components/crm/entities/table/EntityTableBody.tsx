import { useVirtualizer } from "@tanstack/react-virtual";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EntityTableBodyProps {
  containerRef: React.RefObject<HTMLDivElement>;
  records: any[];
  fields: any[];
  filters: Record<string, any>;
  isLoading?: boolean;
}

export function EntityTableBody({
  containerRef,
  records,
  fields,
  filters,
  isLoading,
}: EntityTableBodyProps) {
  const rowVirtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 45,
    overscan: 10,
  });

  if (isLoading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={fields.length} className="h-24 text-center">
            <div className="flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Carregando registros...
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (records.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={fields.length} className="h-24 text-center text-muted-foreground">
            Nenhum registro encontrado
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
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
      })}
    </TableBody>
  );
}
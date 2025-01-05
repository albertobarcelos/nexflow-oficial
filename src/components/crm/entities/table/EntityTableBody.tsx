import { useVirtualizer } from "@tanstack/react-virtual";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
          <TableCell colSpan={fields.length} className="h-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-muted-foreground"
            >
              Nenhum registro encontrado
            </motion.div>
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
          <motion.tr
            key={virtualRow.index}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: virtualRow.index * 0.05 }}
            className={cn(
              "relative border-b transition-colors hover:bg-muted/50",
              virtualRow.index % 2 === 0 ? "bg-background" : "bg-muted/5"
            )}
          >
            {fields.map((field) => (
              <TableCell 
                key={field.id}
                className={cn(
                  "transition-colors p-4",
                  filters[field.id] && 
                  record[field.name]?.toString().toLowerCase().includes(filters[field.id].toLowerCase()) && 
                  "bg-primary/5 font-medium"
                )}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {record[field.name] || "-"}
                </motion.div>
              </TableCell>
            ))}
          </motion.tr>
        );
      })}
    </TableBody>
  );
}
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FilterPopover } from "./FilterPopover";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar ${entityName.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-8 transition-colors focus:border-primary"
            />
            <AnimatePresence>
              {searchTerm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-muted"
                    onClick={() => onSearchChange("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
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
                "relative transition-colors hover:bg-muted",
                activeFilters.length > 0 && "border-primary"
              )}
            >
              <Filter className="h-4 w-4" />
              <AnimatePresence>
                {activeFilters.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                    >
                      {activeFilters.length}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </FilterPopover>
        </div>
      </div>

      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            {activeFilters.map((fieldId) => {
              const field = fields.find(f => f.id === fieldId);
              if (!field) return null;
              return (
                <motion.div
                  key={fieldId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 group transition-colors hover:bg-muted"
                  >
                    <span className="font-medium">{field.name}:</span>
                    <span className="opacity-75">{filters[fieldId]}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 opacity-60 group-hover:opacity-100 transition-opacity"
                      onClick={() => onClearFilter(fieldId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </motion.div>
              );
            })}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15, delay: 0.1 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs hover:bg-muted transition-colors"
                onClick={() => activeFilters.forEach(onClearFilter)}
              >
                Limpar todos
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
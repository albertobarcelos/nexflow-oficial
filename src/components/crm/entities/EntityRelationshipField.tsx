import { useState, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import debounce from "lodash/debounce";
import { motion, AnimatePresence } from "framer-motion";

interface EntityRelationshipFieldProps {
  entityId: string;
  fieldId: string;
  value: string | null;
  onChange: (value: string | null) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function EntityRelationshipField({
  entityId,
  fieldId,
  value,
  onChange,
  onCreateNew,
  placeholder = "Selecione um registro...",
  disabled = false,
}: EntityRelationshipFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["related-records", entityId, search, page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_related_records", {
        p_entity_id: entityId,
        p_search_term: search || null,
        p_page: page,
        p_page_size: pageSize,
      });

      if (error) throw error;
      return data;
    },
  });

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
      setPage(1);
    }, 300),
    []
  );

  const handleSearch = (value: string) => {
    debouncedSearch(value);
  };

  const selectedItem = data?.find((item) => item.record_id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between transition-all duration-200",
            open && "ring-2 ring-primary/20",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedItem ? selectedItem.display_value : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Buscar..."
              onValueChange={handleSearch}
              className="border-0 focus:ring-0"
            />
            <AnimatePresence>
              {search && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-muted"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm">
              {search ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  Nenhum registro encontrado para "{search}"
                </motion.div>
              ) : (
                "Nenhum registro encontrado"
              )}
            </CommandEmpty>

            {onCreateNew && (
              <>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      onCreateNew();
                    }}
                    className="flex items-center gap-2 py-3 px-4 cursor-pointer hover:bg-muted transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Criar novo registro</span>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            <CommandGroup>
              {isLoading || isFetching ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-6"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {data?.map((item) => (
                    <motion.div
                      key={item.record_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CommandItem
                        value={item.record_id}
                        onSelect={() => {
                          onChange(item.record_id);
                          setOpen(false);
                        }}
                        className="flex items-center gap-2 py-2 px-4 cursor-pointer hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Check
                            className={cn(
                              "h-4 w-4 transition-opacity",
                              value === item.record_id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <span className="truncate">{item.display_value}</span>
                        </div>
                      </CommandItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
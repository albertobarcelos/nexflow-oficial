import { useState, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2, Plus, Search } from "lucide-react";
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
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedItem ? selectedItem.display_value : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Buscar..."
              onValueChange={handleSearch}
            />
          </div>
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm">
              Nenhum registro encontrado
            </CommandEmpty>

            {onCreateNew && (
              <>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      onCreateNew();
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar novo registro
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            <CommandGroup>
              {isLoading || isFetching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                data?.map((item) => (
                  <CommandItem
                    key={item.record_id}
                    value={item.record_id}
                    onSelect={() => {
                      onChange(item.record_id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.record_id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.display_value}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
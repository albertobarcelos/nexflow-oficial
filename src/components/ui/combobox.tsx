import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command as CommandPrimitive } from "cmdk";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ComboboxItem {
  label: string;
  value: string;
  description?: string;
}

export interface ComboboxProps {
  items: ComboboxItem[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Combobox({
  items,
  value,
  onChange,
  placeholder,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredItems = React.useMemo(() => {
    if (!search) return items;
    const searchStr = search.toLowerCase().trim();
    return items.filter((item) => 
      item.label.toLowerCase().includes(searchStr) ||
      item.description?.toLowerCase().includes(searchStr)
    );
  }, [items, search]);

  const selectedItem = items.find((item) => item.value === value);

  return (
    <div className="relative w-full">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn(
          "w-full justify-between font-normal",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
      >
        {selectedItem ? (
          <span className="text-foreground">{selectedItem.label}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
          <CommandPrimitive className="w-full">
            <div className="flex items-center border-b px-3">
              <CommandPrimitive.Input
                value={search}
                onValueChange={setSearch}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Digite para buscar..."
              />
            </div>
            <div className="max-h-[300px] overflow-auto p-1">
              {filteredItems.length === 0 ? (
                <div className="py-6 text-center text-sm">
                  Nenhum resultado encontrado.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <CommandPrimitive.Item
                    key={item.value}
                    value={item.label}
                    onSelect={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-foreground"
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {item.value === value && (
                        <Check className="h-4 w-4" />
                      )}
                    </span>
                    <div className="flex flex-col">
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </CommandPrimitive.Item>
                ))
              )}
            </div>
          </CommandPrimitive>
        </div>
      )}
    </div>
  );
}

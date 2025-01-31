import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import * as Popover from "@radix-ui/react-popover";
import * as Command from "@radix-ui/react-command";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Combobox = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    value?: string;
    onValueChange?: (value: string) => void;
  }
>(({ className, open, onOpenChange, value, onValueChange, ...props }, ref) => (
  <div ref={ref} className={cn("relative", className)} {...props} />
));
Combobox.displayName = "Combobox";

const ComboboxTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Popover.Trigger>
>(({ className, children, ...props }, ref) => (
  <Popover.Trigger ref={ref} className={cn("w-full", className)} {...props}>
    {children}
  </Popover.Trigger>
));
ComboboxTrigger.displayName = "ComboboxTrigger";

const ComboboxContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Popover.Content>
>(({ className, children, ...props }, ref) => (
  <Popover.Portal>
    <Popover.Content
      ref={ref}
      className={cn(
        "relative z-50 min-w-[200px] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    >
      {children}
    </Popover.Content>
  </Popover.Portal>
));
ComboboxContent.displayName = "ComboboxContent";

const ComboboxInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof Command.Input>
>(({ className, ...props }, ref) => (
  <Command.Input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
ComboboxInput.displayName = "ComboboxInput";

const ComboboxEmpty = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Command.Empty>
>(({ className, ...props }, ref) => (
  <Command.Empty
    ref={ref}
    className={cn("py-6 text-center text-sm", className)}
    {...props}
  />
));
ComboboxEmpty.displayName = "ComboboxEmpty";

const ComboboxGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Command.Group>
>(({ className, ...props }, ref) => (
  <Command.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
));
ComboboxGroup.displayName = "ComboboxGroup";

const ComboboxItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Command.Item>
>(({ className, children, ...props }, ref) => (
  <Command.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </Command.Item>
));
ComboboxItem.displayName = "ComboboxItem";

interface ComboboxItem {
  label: string;
  value: string;
  description?: string;
}

interface ComboboxProps {
  items: ComboboxItem[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Combobox({
  items,
  value,
  onChange,
  placeholder,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedItem = items.find((item) => item.value === value);

  return (
    <Combobox open={open} onOpenChange={setOpen}>
      <ComboboxTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedItem ? selectedItem.label : placeholder || "Selecione..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </ComboboxTrigger>
      <ComboboxContent className="w-full p-0">
        <Command>
          <ComboboxInput placeholder="Buscar..." />
          <ComboboxEmpty>Nenhum item encontrado.</ComboboxEmpty>
          <ComboboxGroup className="max-h-[300px] overflow-auto">
            {items.map((item) => (
              <ComboboxItem
                key={item.value}
                value={item.value}
                onSelect={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === item.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <div>
                  <div>{item.label}</div>
                  {item.description && (
                    <div className="text-sm text-muted-foreground">
                      {item.description}
                    </div>
                  )}
                </div>
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        </Command>
      </ComboboxContent>
    </Combobox>
  );
}

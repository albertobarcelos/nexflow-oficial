import * as React from "react"
import { Check } from "lucide-react"
import * as Popover from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxWithSearchProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  popoverClassName?: string
}

export function ComboboxWithSearch({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  emptyMessage = "No results found.",
  className,
  popoverClassName,
}: ComboboxWithSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {selectedOption?.label ?? placeholder}
          <span className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={cn(
            "w-[--radix-popover-trigger-width] p-0",
            popoverClassName
          )}
        >
          <Command>
            <CommandInput
              placeholder="Search..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-9"
            />
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange?.(currentValue)
                    setOpen(false)
                  }}
                >
                  {option.label}
                  {value === option.value && (
                    <Check className="ml-auto h-4 w-4 opacity-100" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

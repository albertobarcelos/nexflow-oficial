import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { useUsers } from "@/hooks/useUsers";
import { Checkbox } from "@/components/ui/checkbox";

interface AgentsMultiSelectProps {
  value?: string[];
  onChange: (agentIds: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AgentsMultiSelect({
  value = [],
  onChange,
  placeholder = "Selecione os responsáveis",
  className,
  disabled = false,
}: AgentsMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const { data: users = [] } = useUsers();

  const activeUsers = users.filter((user) => user.is_active);
  const selectedUsers = activeUsers.filter((user) => value.includes(user.id));

  const handleToggle = (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId));
    } else {
      onChange([...value, userId]);
    }
  };

  const handleRemove = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((id) => id !== userId));
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal min-h-[2.5rem] h-auto py-2",
              !value.length && "text-slate-400"
            )}
            disabled={disabled}
          >
            {selectedUsers.length > 0 ? (
              <div className="flex flex-wrap gap-1 w-full">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-0.5 text-xs"
                  >
                    {user.name} {user.surname}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => handleRemove(user.id, e)}
                        className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar usuário..." />
            <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {activeUsers.map((user) => {
                const isSelected = value.includes(user.id);
                return (
                  <CommandItem
                    key={user.id}
                    value={`${user.name} ${user.surname} ${user.id}`}
                    onSelect={() => handleToggle(user.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(user.id)}
                      className="pointer-events-none"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {user.name} {user.surname}
                      </p>
                      {user.email && (
                        <p className="text-xs text-slate-500">{user.email}</p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary ml-auto" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

















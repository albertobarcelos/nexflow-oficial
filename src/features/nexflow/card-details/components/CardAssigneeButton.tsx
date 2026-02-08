import { useState } from "react";
import { UserPlus, Check, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { useUsers } from "@/hooks/useUsers";

interface CardAssigneeButtonProps {
  assignedTo: string | null;
  onAssignChange: (userId: string | null) => void;
  isDisabled?: boolean;
}

/**
 * Botão compacto para atribuir/trocar responsável do card no header.
 * Exibe UserPlus quando sem responsável, UserAvatar quando atribuído.
 * Ao clicar abre popover com lista de usuários e opção de limpar.
 */
export function CardAssigneeButton({
  assignedTo,
  onAssignChange,
  isDisabled = false,
}: CardAssigneeButtonProps) {
  const [open, setOpen] = useState(false);
  const { data: users = [] } = useUsers();

  const assignedUser = assignedTo
    ? users.find((u) => u.id === assignedTo)
    : null;

  const activeUsers = users.filter((u) => u.is_active);

  const handleSelect = (userId: string | null) => {
    onAssignChange(userId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={isDisabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0 rounded-full transition-colors",
            "hover:bg-slate-100 text-slate-500 hover:text-slate-700",
            isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
          )}
          title={assignedUser ? "Trocar responsável" : "Atribuir responsável"}
          disabled={isDisabled}
        >
          {assignedUser ? (
            <UserAvatar
              user={assignedUser}
              size="sm"
              className="h-8 w-8 ring-1 ring-slate-200 hover:ring-slate-300"
            />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar usuário..." className="h-9" />
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
            Nenhum usuário encontrado.
          </CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto p-1">
            {assignedUser && (
              <CommandItem
                value="limpar responsável"
                onSelect={() => handleSelect(null)}
                className="flex items-center gap-3 py-2 text-muted-foreground"
              >
                <UserX className="h-4 w-4" />
                <span>Limpar responsável</span>
              </CommandItem>
            )}
            {activeUsers.map((user) => (
              <CommandItem
                key={user.id}
                value={`${user.name} ${user.surname} ${user.id}`}
                onSelect={() => handleSelect(user.id)}
                className="flex items-center gap-3 py-2"
              >
                <UserAvatar
                  user={user}
                  size="sm"
                  className="ring-1 ring-border"
                />
                <span className="flex-1 truncate text-sm">
                  {user.name} {user.surname}
                </span>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4 text-primary",
                    assignedTo === user.id ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

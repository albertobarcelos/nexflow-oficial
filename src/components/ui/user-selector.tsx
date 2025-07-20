import React, { useState } from "react";
import { Check, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./user-avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

// AIDEV-NOTE: Componente personalizado para seleção de usuário responsável
// Design único com avatar, nome e combobox elegante usando Poppins

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_type?: string;
  avatar_seed?: string;
  custom_avatar_url?: string | null;
  avatar_url?: string | null;
}

interface UserSelectorProps {
  users: User[];
  value?: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  className?: string;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  users,
  value,
  onChange,
  placeholder = "Selecionar responsável",
  className
}) => {
  const [open, setOpen] = useState(false);
  
  const selectedUser = users.find(user => user.id === value);
  
  const getUserDisplayName = (user: User) => {
    return `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Usuário";
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Área do usuário selecionado */}
      <div className="flex items-center justify-between py-4 px-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-primary/5 transition-all duration-200 cursor-pointer group border border-transparent hover:border-primary/20 w-[320px]">
              <div className="relative">
                <UserAvatar 
                  user={selectedUser}
                  size="md"
                  className="ring-2 ring-primary/20 shadow-sm group-hover:ring-primary/30 transition-all duration-200"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground font-['Poppins'] group-hover:text-primary transition-colors duration-200">
                  Responsável Interno
                </h4>
                <p className="text-xs text-muted-foreground font-['Poppins'] font-light truncate">
                  {selectedUser ? getUserDisplayName(selectedUser) : "Clique para selecionar responsável"}
                </p>
              </div>
              
              {/* Ícone de dropdown */}
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all duration-200 group-hover:scale-110 flex-shrink-0" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0 shadow-xl border-primary/20" align="end">
            <Command className="font-['Poppins']">
              <CommandInput 
                placeholder="Buscar usuário..." 
                className="h-10 font-['Poppins'] font-light"
              />
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground font-['Poppins'] font-light">
                Nenhum usuário encontrado.
              </CommandEmpty>
              <CommandGroup className="max-h-[200px] overflow-auto">
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`${user.first_name} ${user.last_name} ${user.id}`}
                    onSelect={() => {
                      onChange(user.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-primary/5 transition-colors duration-150"
                  >
                    <UserAvatar 
                      user={user}
                      size="sm"
                      className="ring-1 ring-border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground font-['Poppins'] truncate">
                        {getUserDisplayName(user)}
                      </p>
                      <p className="text-xs text-muted-foreground font-['Poppins'] font-light">
                        {user.first_name && user.last_name ? "Usuário ativo" : "Perfil incompleto"}
                      </p>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 text-primary",
                        value === user.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Divisor elegante */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
    </div>
  );
};
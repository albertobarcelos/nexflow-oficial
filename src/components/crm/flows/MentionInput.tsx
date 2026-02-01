import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { useNexflowUsers } from '@/hooks/useNexflowUsers';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange?: (mentions: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MentionInput({
  value,
  onChange,
  onMentionsChange,
  placeholder = 'Digite uma mensagem...',
  className,
}: MentionInputProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { data: users = [] } = useNexflowUsers();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Verificar se há @ no texto
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Se não há espaço após o @, mostrar sugestões
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionQuery(textAfterAt.toLowerCase());
        setShowMentions(true);
        setSelectedIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }

    // Extrair menções do texto
    if (onMentionsChange) {
      const mentionRegex = /@(\w+)/g;
      const mentions: string[] = [];
      let match;
      while ((match = mentionRegex.exec(newValue)) !== null) {
        const mentionText = match[1].toLowerCase();
        const user = users.find(
          (u) =>
            (u.firstName?.toLowerCase() || '').includes(mentionText) ||
            (u.lastName?.toLowerCase() || '').includes(mentionText) ||
            u.email.toLowerCase().includes(mentionText)
        );
        if (user) {
          mentions.push(user.id);
        }
      }
      onMentionsChange([...new Set(mentions)]);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!mentionQuery) return true;
    const searchText = mentionQuery.toLowerCase();
    return (
      (user.firstName?.toLowerCase() || '').includes(searchText) ||
      (user.lastName?.toLowerCase() || '').includes(searchText) ||
      user.email.toLowerCase().includes(searchText)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions || filteredUsers.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredUsers.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < filteredUsers.length) {
          e.preventDefault();
          handleMentionSelect(filteredUsers[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowMentions(false);
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
        break;
      default:
        // Permitir digitação normal
        break;
    }
  };

  const handleMentionSelect = (user: { id: string; firstName: string | null; lastName: string | null; email: string }) => {
    if (!textareaRef.current) return;

    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterCursor = value.substring(cursorPosition);
      const userName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.email;
      const newValue =
        value.substring(0, lastAtIndex) +
        `@${userName} ` +
        textAfterCursor;
      
      onChange(newValue);
      setShowMentions(false);
      setSelectedIndex(0);
      
      // Reposicionar cursor e manter foco
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const userName = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.email;
          const newCursorPosition = lastAtIndex + userName.length + 2;
          textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
          textareaRef.current.focus();
        }
      });
    }
  };

  // Garantir que o textarea mantenha o foco quando o popover abre
  useEffect(() => {
    if (showMentions && textareaRef.current) {
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      });
    }
  }, [showMentions]);

  // Resetar índice selecionado quando a lista de usuários filtrados mudar
  useEffect(() => {
    if (filteredUsers.length > 0 && selectedIndex >= filteredUsers.length) {
      setSelectedIndex(0);
    }
  }, [filteredUsers.length, selectedIndex]);

  return (
    <Popover open={showMentions} onOpenChange={(open) => {
      setShowMentions(open);
      if (!open) {
        setSelectedIndex(0);
      }
    }}>
      <div className="relative" ref={popoverRef}>
        <PopoverTrigger asChild>
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true" />
        </PopoverTrigger>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn('min-h-[100px]', className)}
        />
      </div>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className={cn(
          "p-0 w-[min(300px,calc(100vw-16px))]",
          "max-h-[300px] overflow-hidden"
        )}
        onOpenAutoFocus={(e) => {
          // Prevenir que o popover roube o foco
          e.preventDefault();
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }}
        onInteractOutside={(e) => {
          // Prevenir fechamento quando clicar no textarea ou no wrapper
          if (popoverRef.current?.contains(e.target as Node)) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Permitir fechar com Escape, mas manter foco no textarea
          setShowMentions(false);
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }}
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty>Nenhum usuário encontrado</CommandEmpty>
            <CommandGroup>
              {filteredUsers.slice(0, 10).map((user, index) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleMentionSelect(user)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    index === selectedIndex && "bg-accent"
                  )}
                  value={user.id}
                >
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback>
                      {((user.firstName || user.email || 'U').charAt(0).toUpperCase())}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.firstName || user.email || 'Sem nome'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Componente para exibir avatares de times
// Mostra iniciais do nome do time ou ícone padrão

interface TeamAvatarProps {
  team?: {
    id?: string;
    name?: string;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackText?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const iconSizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

export const TeamAvatar: React.FC<TeamAvatarProps> = ({
  team,
  size = "md",
  className,
  fallbackText,
}) => {
  // Determinar o texto de fallback
  const getFallbackText = () => {
    if (fallbackText) return fallbackText;

    if (team?.name) {
      // Pegar as primeiras letras de cada palavra (máximo 2)
      const words = team.name.trim().split(/\s+/);
      if (words.length >= 2) {
        return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
      } else if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
      }
    }

    return "T";
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium flex items-center justify-center">
        {team?.name ? (
          <span className="text-xs font-semibold">{getFallbackText()}</span>
        ) : (
          <Users className={iconSizeClasses[size]} />
        )}
      </AvatarFallback>
    </Avatar>
  );
};


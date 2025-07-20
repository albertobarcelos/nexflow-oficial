import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactToyFace from "react-toy-face";
import { cn } from "@/lib/utils";

// AIDEV-NOTE: Componente universal para exibir avatares de usuário
// Suporta ToyFace e imagens personalizadas, com fallback para iniciais

interface UserAvatarProps {
  user?: {
    first_name?: string;
    last_name?: string;
    avatar_type?: string;
    avatar_seed?: string;
    custom_avatar_url?: string | null;
    avatar_url?: string | null;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackText?: string;
  lastUpdate?: number; // Para cache busting
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10", 
  lg: "h-12 w-12",
  xl: "h-16 w-16"
};

const toyFaceSizes = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = "md",
  className,
  fallbackText,
  lastUpdate
}) => {
  // Determinar o texto de fallback
  const getFallbackText = () => {
    if (fallbackText) return fallbackText;
    
    const firstName = user?.first_name || "";
    const lastName = user?.last_name || "";
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    
    return "U";
  };

  // AIDEV-NOTE: Processar seed do ToyFace (formato: "toyNumber|group")
  if (user?.avatar_type === "toy_face" && user?.avatar_seed) {
    const seedParts = user.avatar_seed.split("|");
    const toyNumber = parseInt(seedParts[0]) || 1;
    const group = parseInt(seedParts[1]) || 1;
    
    return (
      <div className={cn(sizeClasses[size], "rounded-full overflow-hidden flex items-center justify-center", className)}>
        <ReactToyFace
          size={toyFaceSizes[size]}
          toyNumber={toyNumber}
          group={group}
          rounded={toyFaceSizes[size] / 2}
        />
      </div>
    );
  }

  // Se tem imagem personalizada
  const avatarUrl = user?.custom_avatar_url || user?.avatar_url;
  
  // Adicionar timestamp para evitar cache do browser apenas quando lastUpdate está disponível
  const avatarUrlWithTimestamp = avatarUrl && lastUpdate ? `${avatarUrl}?t=${lastUpdate}` : avatarUrl;
  
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarUrlWithTimestamp && (
        <AvatarImage 
          src={avatarUrlWithTimestamp} 
          alt={`${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Avatar"}
        />
      )}
      <AvatarFallback className="bg-primary/10 text-primary font-medium">
        {getFallbackText()}
      </AvatarFallback>
    </Avatar>
  );
};
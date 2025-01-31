import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus } from "lucide-react";
import ReactToyFace from "react-toy-face";

interface PartnerAvatarProps {
  partner?: {
    id: string;
    name: string;
    avatar_type?: string;
    avatar_seed?: string;
    custom_avatar_url?: string;
  };
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
}

export function PartnerAvatar({ partner, size = "md", showStatus = false }: PartnerAvatarProps) {
  // Definir tamanhos baseados no prop size
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  const sizePx = {
    sm: 32,
    md: 48,
    lg: 64
  };

  // Se não houver parceiro, mostrar avatar padrão
  if (!partner) {
    return (
      <Avatar className={`${sizeClasses[size]} bg-gray-100`}>
        <AvatarFallback>
          <UserPlus className="h-6 w-6 text-gray-400" />
        </AvatarFallback>
      </Avatar>
    );
  }

  // Renderizar avatar baseado no tipo
  const renderAvatar = () => {
    if (partner.avatar_type === "custom" && partner.custom_avatar_url) {
      return (
        <Avatar className={`${sizeClasses[size]} ring-2 ring-white shadow-sm`}>
          <AvatarImage src={partner.custom_avatar_url} alt={partner.name} />
          <AvatarFallback>
            {partner.name.split(" ").map(n => n[0]).join("").toUpperCase()}
          </AvatarFallback>
        </Avatar>
      );
    }

    // Usar React Toy Face
    if (partner.avatar_type === "toy_face" && partner.avatar_seed) {
      // Extrair número e grupo do avatar_seed
      const [toyNumberStr, groupStr] = partner.avatar_seed.split("|");
      const toyNumber = parseInt(toyNumberStr) || 1;
      const group = parseInt(groupStr) || 1;

      return (
        <div className={`${sizeClasses[size]} overflow-hidden rounded-full ring-2 ring-white shadow-sm`}>
          <ReactToyFace
            size={sizePx[size]}
            toyNumber={toyNumber}
            rounded={sizePx[size] / 2}
            group={group}
          />
        </div>
      );
    }

    // Fallback para iniciais
    return (
      <Avatar className={`${sizeClasses[size]} ring-2 ring-white shadow-sm`}>
        <AvatarFallback>
          {partner.name.split(" ").map(n => n[0]).join("").toUpperCase()}
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div className="relative">
      {renderAvatar()}
      
      {/* Indicador de status (opcional) */}
      {showStatus && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
      )}
    </div>
  );
} 

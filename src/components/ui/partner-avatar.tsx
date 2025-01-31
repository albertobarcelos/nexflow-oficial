import { UserCircle2 } from "lucide-react";
import ReactToyFace from "react-toy-face";
import { cn } from "@/lib/utils";

interface PartnerAvatarProps {
  avatarType?: string;
  avatarSeed?: string | number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: {
    container: "h-20 w-20",
    toy: 80,
  },
  md: {
    container: "h-24 w-24",
    toy: 115,
  },
  lg: {
    container: "h-28 w-28",
    toy: 112,
  }
};

export function PartnerAvatar({ 
  avatarType, 
  avatarSeed = "1|1",
  size = "md",
  className 
}: PartnerAvatarProps) {
  const sizeConfig = sizeMap[size];
  
  // Interpreta o seed no formato "number|group"
  const [toyNumber, group] = (typeof avatarSeed === 'string' ? avatarSeed : String(avatarSeed))
    .split('|')
    .map(Number);

  return (
    <div className="relative">
      <div className={cn(
        sizeConfig.container,
        "rounded-full bg-gradient-to-br from-primary/0 to-primary/10",
        "flex items-center justify-center overflow-hidden",
        className
      )}>
        <div className="absolute inset-0 rounded-full ring-1 ring-primary/20" />
        {avatarType === "toy_face" ? (
          <div className="scale-100 transform translate-y-1" key={`${toyNumber}-${group}`}>
            <ReactToyFace
              size={sizeConfig.toy}
              toyNumber={toyNumber || 1}
              group={group || 1}
              rounded={sizeConfig.toy / 2}
            />
          </div>
        ) : (
          <UserCircle2 className="w-3/4 h-3/4 text-primary" />
        )}
      </div>
    </div>
  );
}
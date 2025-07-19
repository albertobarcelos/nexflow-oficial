// AIDEV-NOTE: Card de pessoa vinculada à empresa

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Smartphone } from "lucide-react";
import { Person } from "../../types";
import { formatPhone } from "@/lib/format";

interface PersonCardProps {
  person: Person;
}

/**
 * Componente que exibe os detalhes de uma pessoa vinculada à empresa
 */
const PersonCard = ({ person }: PersonCardProps) => {
  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg">
      <Avatar className="h-10 w-10">
        <AvatarFallback>
          {person.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{person.name}</h3>
          {person.is_primary && (
            <Badge variant="outline" className="h-5 text-[10px]">
              Principal
            </Badge>
          )}
        </div>
        
        {person.role && (
          <p className="text-sm text-muted-foreground">{person.role}</p>
        )}
        
        <div className="space-y-1.5">
          {person.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${person.email}`}
                className="text-sm text-primary hover:underline"
              >
                {person.email}
              </a>
            </div>
          )}
          
          {person.whatsapp && (
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                <path d="M9.5 13.5c.5 1 1.5 1 2 1s1.5 0 2-1" />
              </svg>
              <a
                href={`https://wa.me/${person.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {formatPhone(person.whatsapp)}
              </a>
            </div>
          )}
          
          {person.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a
                href={`tel:${person.phone}`}
                className="text-sm text-primary hover:underline"
              >
                {formatPhone(person.phone)}
              </a>
            </div>
          )}
          
          {person.mobile && (
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <a
                href={`tel:${person.mobile}`}
                className="text-sm text-primary hover:underline"
              >
                {formatPhone(person.mobile)}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonCard;
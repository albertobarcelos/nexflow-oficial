// AIDEV-NOTE: Card de pessoas vinculadas à empresa (versão resumida para a aba Visão Geral)

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Smartphone } from "lucide-react";
import { useCompanyPeople } from "../../hooks/index";
import { Company } from "../../types";
import { formatPhone } from "@/lib/format";

interface PeopleCardProps {
  company: Company | null;
}

/**
 * Componente que exibe uma versão resumida das pessoas vinculadas à empresa
 */
const PeopleCard = ({ company }: PeopleCardProps) => {
  const { data: people = [], isLoading } = useCompanyPeople(company?.id);

  if (!company) return null;

  // Limita a exibição a 3 pessoas na visão geral
  const displayPeople = people.slice(0, 3);
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Pessoas Vinculadas</CardTitle>
          <span className="text-xs text-muted-foreground">
            {people.length} {people.length === 1 ? "pessoa" : "pessoas"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : displayPeople.length > 0 ? (
          <div className="space-y-4">
            {displayPeople.map((person) => (
              <div key={person.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {person.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{person.name}</span>
                    {person.is_primary && (
                      <Badge variant="outline" className="h-5 text-[10px]">
                        Principal
                      </Badge>
                    )}
                  </div>
                  
                  {person.role && (
                    <p className="text-xs text-muted-foreground">{person.role}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {person.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <a
                          href={`mailto:${person.email}`}
                          className="text-xs text-primary hover:underline"
                        >
                          {person.email}
                        </a>
                      </div>
                    )}
                    
                    {person.whatsapp && (
                      <div className="flex items-center gap-1">
                        <svg
                          className="h-3 w-3 text-muted-foreground"
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
                          className="text-xs text-primary hover:underline"
                        >
                          {formatPhone(person.whatsapp)}
                        </a>
                      </div>
                    )}
                    
                    {person.mobile && (
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3 text-muted-foreground" />
                        <a
                          href={`tel:${person.mobile}`}
                          className="text-xs text-primary hover:underline"
                        >
                          {formatPhone(person.mobile)}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {people.length > 3 && (
              <p className="text-xs text-muted-foreground pt-1">
                + {people.length - 3} {people.length - 3 === 1 ? "pessoa" : "pessoas"} não exibidas
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma pessoa vinculada a esta empresa
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PeopleCard;
// AIDEV-NOTE: Cabeçalho com informações básicas da empresa e seletor de responsável

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserSelector } from "@/components/ui/user-selector";
import { formatCNPJ } from "@/lib/format";
import { CalendarDays, Users } from "lucide-react";
import { getCompanyInitials } from "./utils";
import { Company } from "./types";
import { useUsers } from "@/hooks/useUsers";
import { useUpdateCompany } from "./hooks/useUpdateCompany";

interface CompanyHeaderProps {
  company: Company | null;
  peopleCount: number;
}

/**
 * Componente que exibe o cabeçalho com informações básicas da empresa
 */
const CompanyHeader = ({ company, peopleCount }: CompanyHeaderProps) => {
  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers();
  const updateCompany = useUpdateCompany(company?.id || '');

  if (!company) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const handleResponsibleChange = async (userId: string) => {
    try {
      await updateCompany.mutateAsync({ creator_id: userId });
    } catch (error) {
      console.error('Erro ao atualizar responsável:', error);
    }
  };

  return (
    <div className="flex flex-col space-y-4 pb-4 border-b">
      <div className="flex items-center justify-between gap-4">
        {/* Lado esquerdo - Informações da empresa */}
        <div className="flex items-center gap-4 flex-1">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {getCompanyInitials(company.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{company.name}</h2>
              {company.is_favorite && (
                <Badge variant="secondary" className="h-5">
                  Favorito
                </Badge>
              )}
            </div>
            
            {company.cnpj && (
              <p className="text-sm text-muted-foreground">
                CNPJ: {formatCNPJ(company.cnpj)}
              </p>
            )}
          </div>
        </div>

        {/* Lado direito - Seletor de responsável */}
        <div className="flex-shrink-0">
          <UserSelector
            users={users}
            value={company.creator_id || ''}
            onChange={handleResponsibleChange}
            placeholder="Selecionar responsável"
            className="w-auto"
          />
        </div>
      </div>



      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>
            {peopleCount} {peopleCount === 1 ? "pessoa" : "pessoas"}
          </span>
        </div>
        
        {company.origin && (
          <div className="flex items-center gap-1.5">
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
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>Origem: {company.origin}</span>
          </div>
        )}
        
        {company.created_at && (
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>Criado em {formatDate(company.created_at)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyHeader;
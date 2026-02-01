import { useMemo } from "react";
import {
  ArrowUp,
  ArrowDown,
  User,
  Package,
  CheckSquare,
  Timer,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { useUsers } from "@/hooks/useUsers";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { useCardTags } from "@/hooks/useCardTags";
import { useCardHistory } from "@/hooks/useCardHistory";
import { useContactById } from "@/hooks/useContactById";
import { useContactCompanies } from "@/hooks/useContactCompanies";
import { useCardChildren } from "@/hooks/useCardChildren";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import type { NexflowCard } from "@/types/nexflow";

interface KanbanCardPreviewProps {
  card: NexflowCard;
}

export function KanbanCardPreview({ card }: KanbanCardPreviewProps) {
  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useOrganizationTeams();
  const { data: cardTags = [] } = useCardTags(card.id);
  const { data: cardHistory = [] } = useCardHistory(card.id, card.parentCardId);
  const { data: contact } = useContactById(card.contactId);
  const { companyNames = [] } = useContactCompanies(card.contactId ?? null);
  const { data: hasChildren = false } = useCardChildren(card.id);
  const { companies = [] } = useCompanies();
  
  const assignedUser = card.assignedTo
    ? users.find((user) => user.id === card.assignedTo)
    : null;
  
  const assignedTeam = card.assignedTeamId
    ? teams.find((team) => team.id === card.assignedTeamId)
    : null;

  // Obter última movimentação do histórico
  const lastMovement = useMemo(() => {
    if (cardHistory.length === 0) return null;
    return cardHistory[cardHistory.length - 1];
  }, [cardHistory]);

  // Formatar tempo desde última movimentação
  const timeSinceMovement = useMemo(() => {
    if (!lastMovement) return null;
    const date = new Date(lastMovement.movedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return null; // Não mostrar se for muito recente
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }, [lastMovement]);

  // Calcular progresso do checklist
  const checklistProgress = useMemo(() => {
    if (!card.checklistProgress || Object.keys(card.checklistProgress).length === 0) {
      return null;
    }
    
    let totalItems = 0;
    let checkedItems = 0;
    
    Object.values(card.checklistProgress).forEach((progress) => {
      if (progress && typeof progress === 'object') {
        const items = progress as Record<string, boolean>;
        const itemKeys = Object.keys(items);
        totalItems += itemKeys.length;
        checkedItems += itemKeys.filter(key => items[key] === true).length;
      }
    });
    
    if (totalItems === 0) return null;
    return { checked: checkedItems, total: totalItems };
  }, [card.checklistProgress]);

  // Usar primeira tag do card se existir
  const firstTag = cardTags.length > 0 ? cardTags[0] : null;

  // Nome da empresa: quando card tem company_id, buscar em web_companies; senão do contato
  const companyNameFromId = useMemo(() => {
    if (card.companyId && companies.length > 0) {
      return companies.find((c) => c.id === card.companyId)?.name ?? null;
    }
    return null;
  }, [card.companyId, companies]);

  // Obter primeira empresa do array company_names (fallback quando não há company_id)
  const companyNameFromContact = useMemo(() => {
    if (companyNames.length > 0) return companyNames[0];
    if (contact?.company_names && contact.company_names.length > 0) {
      return contact.company_names[0];
    }
    return null;
  }, [companyNames, contact?.company_names]);

  const companyName = companyNameFromId ?? companyNameFromContact;

  // Nome do contato
  const contactName = contact?.client_name || contact?.main_contact || null;

  // Título do card: prioridade = nome da empresa (company_id) > contato > card.title
  const cardTitle =
     contactName ?? companyNameFromId ?? companyName ?? card.title;

  // Nome do usuário responsável
  const responsibleName = assignedUser 
    ? `${assignedUser.name}${assignedUser.surname ? ` ${assignedUser.surname}` : ''}`
    : assignedTeam
    ? assignedTeam.name
    : null;

  // Função para obter cor de fundo do avatar
  const getAvatarBgColor = (userName?: string): string => {
    const colors = [
      'bg-orange-100 dark:bg-orange-900/40',
      'bg-green-100 dark:bg-green-900/40',
      'bg-purple-100 dark:bg-purple-900/40',
      'bg-yellow-100 dark:bg-yellow-900/40',
      'bg-red-100 dark:bg-red-900/40',
      'bg-gray-100 dark:bg-gray-700',
    ];
    if (!userName) return colors[5];
    const hash = userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const avatarBgClass = getAvatarBgColor(assignedUser?.name);

  return (
    <div className="flex flex-col space-y-2 text-sm relative">
      {/* Topo: Título e Avatar do usuário */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white leading-tight truncate">
            {cardTitle}
          </h3>
          {/* Tag abaixo do título com formato arredondado */}
          {firstTag && (
            <div className="mt-1">
              <span 
                className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold truncate border"
                style={{
                  backgroundColor: `${firstTag.color}15`,
                  color: firstTag.color,
                  borderColor: firstTag.color,
                }}
              >
                {firstTag.name}
              </span>
            </div>
          )}
        </div>
        {/* Avatar do usuário responsável */}
        {assignedUser && (
          <div className={cn("rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 relative z-20", avatarBgClass)}>
            <UserAvatar
              user={{
                name: assignedUser.name,
                surname: assignedUser.surname,
                avatar_type: assignedUser.avatar_type,
                avatar_seed: assignedUser.avatar_seed,
                custom_avatar_url: assignedUser.custom_avatar_url,
                avatar_url: assignedUser.avatar_url,
              }}
              size="sm"
              className="w-7 h-7"
            />
          </div>
        )}
        {!assignedUser && assignedTeam && (
          <div className={cn("rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 relative z-20", avatarBgClass)}>
            <TeamAvatar
              team={{
                id: assignedTeam.id,
                name: assignedTeam.name,
              }}
              size="sm"
              className="w-7 h-7"
            />
          </div>
        )}
      </div>

      {/* Nome do responsável (discreto) */}
      {responsibleName && (
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight truncate">
          {responsibleName}
        </p>
      )}

      {/* Informações adicionais: empresa e valor */}
      {(companyName || (card.value !== null && card.value !== undefined)) && (
        <div className="border-t border-gray-100 dark:border-gray-700 -mx-3 px-3 pt-2">
          <div className="flex justify-between items-center gap-2">
            {companyName && (
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight truncate flex-1">
                {companyName}
              </p>
            )}
            {card.value !== null && card.value !== undefined && (
              <p className="font-bold text-gray-900 dark:text-gray-200 leading-tight whitespace-nowrap">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(card.value)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Rodapé: Indicadores de relacionamentos e métricas */}
      <div className="border-t border-gray-100 dark:border-gray-700 -mx-3 px-3 pt-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {card.parentCardId && (
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400" title="Possui card pai">
              <ArrowUp className="h-3.5 w-3.5" />
            </div>
          )}
          {hasChildren && (
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400" title="Possui cards filhos">
              <ArrowDown className="h-3.5 w-3.5" />
            </div>
          )}
          {card.contactId && (
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400" title="Contato">
              <User className="h-3.5 w-3.5" />
            </div>
          )}
          {card.companyId && (
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400" title="Empresa">
              <Building2 className="h-3.5 w-3.5" />
            </div>
          )}
          {(card.product || (card.value != null && card.value !== undefined)) && (
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400" title="Produto / valor">
              <Package className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 text-xs">
          {checklistProgress && (
            <div className="flex items-center space-x-1">
              <CheckSquare className="h-3 w-3" />
              <span>{checklistProgress.checked}/{checklistProgress.total}</span>
            </div>
          )}
          {timeSinceMovement && (
            <div className="flex items-center space-x-1">
              <Timer className={cn(
                "h-3 w-3",
                (timeSinceMovement.includes('h') && parseInt(timeSinceMovement.replace('h', '')) >= 24) && "text-red-400"
              )} />
              <span className={cn(
                (timeSinceMovement.includes('h') && parseInt(timeSinceMovement.replace('h', '')) >= 24) && "text-red-400 font-medium"
              )}>
                {timeSinceMovement}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


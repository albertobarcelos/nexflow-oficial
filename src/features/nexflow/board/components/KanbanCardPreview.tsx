import { useMemo } from "react";
import { Phone, MessageSquare, Mail, UserX, CheckSquare, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { useUsers } from "@/hooks/useUsers";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { useCardTags } from "@/hooks/useCardTags";
import { useCardHistory } from "@/hooks/useCardHistory";
import { useContactById } from "@/hooks/useContactById";
import { useContactCompanies } from "@/hooks/useContactCompanies";
import type { NexflowCard } from "@/types/nexflow";

interface KanbanCardPreviewProps {
  card: NexflowCard;
}

// Função para obter cor do badge baseada na primeira tag ou tipo do card
function getBadgeColorClass(tagColor?: string, cardType?: string, cardTitle?: string): string {
  // Cores padrão baseadas no tipo
  if (cardType === 'finance') {
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200';
  }
  // Cores variadas para diferentes tipos
  const colors = [
    'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
    'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200',
    'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200',
    'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
    'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  ];
  // Usar hash simples do título para consistência
  if (cardTitle) {
    const hash = cardTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }
  return colors[0];
}

// Função para obter cor de fundo do avatar
function getAvatarBgColor(userName?: string): string {
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
}

export function KanbanCardPreview({ card }: KanbanCardPreviewProps) {
  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useOrganizationTeams();
  const { data: cardTags = [] } = useCardTags(card.id);
  const { data: cardHistory = [] } = useCardHistory(card.id, card.parentCardId);
  const { data: contact } = useContactById(card.contactId);
  const { companies: contactCompanies = [] } = useContactCompanies(card.contactId ?? null);
  
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

  // Usar primeira tag do card se existir, caso contrário não mostrar badge
  const firstTag = cardTags.length > 0 ? cardTags[0] : null;

  // Obter empresa primária ou primeira empresa
  const primaryCompany = useMemo(() => {
    const primary = contactCompanies.find(c => c.is_primary);
    return primary?.company || contactCompanies[0]?.company || null;
  }, [contactCompanies]);

  // Nome do contato
  const contactName = contact?.client_name || contact?.main_contact || null;
  const companyName = primaryCompany?.name || primaryCompany?.razao_social || null;

  // Cor do avatar
  const avatarBgClass = getAvatarBgColor(assignedUser?.name);

  return (
    <div className="flex flex-col space-y-2 text-sm relative">
      {/* Topo: Badge + Avatar */}
      <div className="flex items-center justify-between gap-2">
        {firstTag ? (
          <span 
            className="inline-block px-2 py-0.5 rounded text-xs font-semibold truncate max-w-[calc(100%-40px)] border"
            style={{
              backgroundColor: `${firstTag.color}15`,
              color: firstTag.color,
              borderColor: firstTag.color,
            }}
          >
            {firstTag.name}
          </span>
        ) : (
          <div className="flex-1" />
        )}
        {assignedUser && (
          <div className={cn("rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0", avatarBgClass)}>
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
          <div className={cn("rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0", avatarBgClass)}>
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

      {/* Nome do contato e empresa */}
      <div className="border-t border-gray-100 dark:border-gray-700 -mx-3 px-3 pt-2">
        <div className="flex justify-between items-end gap-2">
          <div className="flex-1 min-w-0">
            {contactName ? (
              <h3 className="font-semibold text-gray-900 dark:text-white leading-tight truncate">
                {contactName}
              </h3>
            ) : (
              <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">
                {card.title}
              </h3>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5 truncate">
              {companyName || "Sem empresa"}
            </p>
          </div>
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

      {/* Ícones de ação e métricas */}
      <div className="border-t border-gray-100 dark:border-gray-700 -mx-3 px-3 pt-2 flex items-center justify-between text-gray-400 dark:text-gray-500">
        <div className="flex space-x-2">
          <button className="hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors" title="Telefone">
            <Phone className="h-4 w-4" />
          </button>
          <button className="hover:text-primary cursor-pointer transition-colors" title="Chat">
            <MessageSquare className="h-4 w-4" />
          </button>
          <button className="hover:text-primary cursor-pointer transition-colors" title="E-mail">
            <Mail className="h-4 w-4" />
          </button>
          <button className="hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors" title="Remover responsável">
            <UserX className="h-4 w-4" />
          </button>
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


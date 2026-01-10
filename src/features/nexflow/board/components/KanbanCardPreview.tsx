import { useMemo } from "react";
import { Tag, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { useUsers } from "@/hooks/useUsers";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { useCardTags } from "@/hooks/useCardTags";
import { useCardHistory } from "@/hooks/useCardHistory";
import type { NexflowCard } from "@/types/nexflow";

interface KanbanCardPreviewProps {
  card: NexflowCard;
}

export function KanbanCardPreview({ card }: KanbanCardPreviewProps) {
  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useOrganizationTeams();
  const { data: cardTags = [] } = useCardTags(card.id);
  const { data: cardHistory = [] } = useCardHistory(card.id, card.parentCardId);
  
  const assignedUser = card.assignedTo
    ? users.find((user) => user.id === card.assignedTo)
    : null;
  
  const assignedTeam = card.assignedTeamId
    ? teams.find((team) => team.id === card.assignedTeamId)
    : null;

  const createdAt = new Date(card.createdAt);
  const updatedAt = createdAt;

  // Obter última movimentação do histórico
  const lastMovement = useMemo(() => {
    if (cardHistory.length === 0) return null;
    return cardHistory[cardHistory.length - 1];
  }, [cardHistory]);

  // Formatar data da última movimentação
  const lastMovementDate = useMemo(() => {
    if (!lastMovement) return null;
    const date = new Date(lastMovement.movedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }, [lastMovement]);

  return (
    <>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">
          {card.title}
        </h3>
        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {createdAt.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}
        </span>
      </div>
      {/* Tags do card */}
      {cardTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-2">
          {cardTags.slice(0, 3).map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-[10px] font-medium px-1.5 py-0 border"
              style={{
                backgroundColor: `${tag.color}15`,
                borderColor: tag.color,
                color: tag.color,
              }}
            >
              <Tag className="h-2.5 w-2.5 mr-0.5" />
              {tag.name}
            </Badge>
          ))}
          {cardTags.length > 3 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              +{cardTags.length - 3}
            </Badge>
          )}
        </div>
      )}
      {/* Campos financeiros - apenas para cards do tipo finance */}
      {card.cardType === 'finance' && (card.product || card.value) && (
        <div className="mb-3 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="space-y-1.5">
            {card.product && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  Produto:
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {card.product}
                </span>
              </div>
            )}
            {card.value !== null && card.value !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  Valor:
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(card.value)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-1">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">Atualizado</span>
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
              {updatedAt.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {/* Histórico de movimentação */}
          {lastMovement && (
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-2.5 w-2.5 text-slate-400" />
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400">
                  {lastMovementDate}
                </span>
                {lastMovement.userName && (
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate max-w-[80px]" title={lastMovement.userName}>
                    por {lastMovement.userName.split(" ")[0]}
                  </span>
                )}
                {lastMovement.fromStepTitle && lastMovement.toStepTitle && (
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate max-w-[100px]" title={`${lastMovement.fromStepTitle} → ${lastMovement.toStepTitle}`}>
                    {lastMovement.fromStepTitle} → {lastMovement.toStepTitle}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        {assignedUser ? (
          <div className="flex items-center gap-2" title={`${assignedUser.name} ${assignedUser.surname}${assignedTeam ? ` - ${assignedTeam.name}` : ''}`}>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {assignedUser.name.split(" ")[0]}
            </span>
            {/* Stack de avatares: usuário na frente, time atrás */}
            <div className="relative flex items-center">
              {/* Avatar do time (atrás) - apenas se existir */}
              {assignedTeam && (
                <div className="absolute -left-2 w-6 h-6 rounded-full ring-2 ring-white dark:ring-slate-700 bg-blue-100 dark:bg-blue-900 flex items-center justify-center z-0">
                  <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                    {(() => {
                      const words = assignedTeam.name.trim().split(/\s+/);
                      if (words.length >= 2) {
                        return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
                      } else if (words.length === 1) {
                        return words[0].substring(0, 2).toUpperCase();
                      }
                      return "T";
                    })()}
                  </span>
                </div>
              )}
              {/* Avatar do usuário (na frente) */}
              <div className={`w-6 h-6 rounded-full ring-2 ring-white dark:ring-slate-700 bg-slate-100 overflow-hidden ${assignedTeam ? 'relative z-10' : ''}`}>
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
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        ) : assignedTeam ? (
          <div className="flex items-center gap-2" title={assignedTeam.name}>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {assignedTeam.name}
            </span>
            <div className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-slate-700 bg-slate-100 overflow-hidden">
              <TeamAvatar
                team={{
                  id: assignedTeam.id,
                  name: assignedTeam.name,
                }}
                size="sm"
                className="w-full h-full"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2" title="Sem responsável">
            <span className="text-xs text-slate-400 italic">--</span>
          </div>
        )}
      </div>
    </>
  );
}


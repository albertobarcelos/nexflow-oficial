import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { ListCardTags } from "./ListCardTags";
import { useUsers } from "@/hooks/useUsers";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { useQueryClient } from "@tanstack/react-query";
import type { NexflowCard, NexflowStepWithFields } from "@/types/nexflow";

interface ListViewProps {
  cards: NexflowCard[];
  steps: NexflowStepWithFields[];
  searchQuery: string;
  isSearchingOnServer: boolean;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  flowId?: string;
  filterUserId: string | null;
  filterTeamId: string | null;
  onCardClick: (card: NexflowCard) => void;
  onPageChange: (page: number) => void;
  onLoadAll: () => Promise<void>;
}

export function ListView({
  cards,
  steps,
  searchQuery,
  isSearchingOnServer,
  currentPage,
  totalPages,
  pageSize,
  hasNextPage,
  isFetchingNextPage,
  onCardClick,
  onPageChange,
  onLoadAll,
}: ListViewProps) {
  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useOrganizationTeams();

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCards = cards.slice(startIndex, endIndex);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Cards</CardTitle>
          {isSearchingOnServer && (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Buscando...</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {cards.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 px-6">
            {searchQuery.trim() ? "Nenhum resultado encontrado" : "Nenhum card encontrado"}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-100 dark:bg-neutral-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                    <th className="px-3 py-2 min-w-[200px] max-w-[300px]">Título</th>
                    <th className="px-3 py-2 min-w-[120px] max-w-[180px]">Etapa</th>
                    <th className="px-3 py-2 min-w-[150px] max-w-[200px]">Tags</th>
                    <th className="px-3 py-2 min-w-[150px] max-w-[200px]">Responsável</th>
                    <th className="px-3 py-2 min-w-[100px] max-w-[120px]">Status</th>
                    <th className="px-3 py-2 min-w-[100px] max-w-[120px] whitespace-nowrap">Atualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCards.map((card) => {
                    const step = steps.find((item) => item.id === card.stepId);
                    const isFrozenCard = step?.stepType === 'freezing';
                    const assignedUser = card.assignedTo
                      ? users.find((user) => user.id === card.assignedTo)
                      : null;
                    const assignedTeam = card.assignedTeamId
                      ? teams.find((team) => team.id === card.assignedTeamId)
                      : null;
                    const createdAt = new Date(card.createdAt);
                    
                    return (
                      <tr
                        key={card.id}
                        className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                        onClick={() => onCardClick(card)}
                      >
                        <td className="px-3 py-3 font-medium text-neutral-800 dark:text-neutral-100">
                          <div className="max-w-[300px] truncate" title={card.title}>
                            {card.title}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-neutral-500 dark:text-neutral-400">
                          <div className="max-w-[180px] truncate" title={step?.title ?? "Etapa"}>
                            {step?.title ?? "Etapa"}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="max-w-[200px]">
                            <ListCardTags cardId={card.id} />
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="max-w-[200px]">
                            {assignedUser ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="shrink-0">
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
                                  />
                                </div>
                                <span className="text-xs text-neutral-600 dark:text-neutral-300 truncate" title={`${assignedUser.name} ${assignedUser.surname}`}>
                                  {assignedUser.name.split(" ")[0]} {assignedUser.surname.split(" ")[0]}
                                </span>
                              </div>
                            ) : assignedTeam ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="shrink-0">
                                  <TeamAvatar
                                    team={{
                                      id: assignedTeam.id,
                                      name: assignedTeam.name,
                                    }}
                                    size="sm"
                                  />
                                </div>
                                <span className="text-xs text-neutral-600 dark:text-neutral-300 truncate" title={assignedTeam.name}>
                                  {assignedTeam.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-400 italic">--</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {card.status === "completed" && (
                              <span className="bg-green-500 text-white rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap border-2 border-white dark:border-gray-800">
                                Concluído
                              </span>
                            )}
                            {card.status === "canceled" && (
                              <span className="bg-red-500 text-white rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap border-2 border-white dark:border-gray-800">
                                Cancelado
                              </span>
                            )}
                            {isFrozenCard && (
                              <span className="bg-blue-500 text-white rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap border-2 border-white dark:border-gray-800">
                                Congelado
                              </span>
                            )}
                            {!card.status && !isFrozenCard && (
                              <span className="text-xs text-neutral-400 italic">--</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-neutral-400 dark:text-neutral-500 text-xs whitespace-nowrap">
                          <div>
                            {createdAt.toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] mt-0.5">
                            {createdAt.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 px-6 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-4">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Mostrando {startIndex + 1} a {Math.min(endIndex, cards.length)} de {cards.length} {cards.length === 1 ? "resultado" : "resultados"}
                {hasNextPage && (
                  <span className="ml-2 text-xs text-neutral-400">
                    (carregando mais...)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasNextPage && !isFetchingNextPage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLoadAll}
                    className="text-xs"
                  >
                    Carregar todos os cards
                  </Button>
                )}
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Carregando...
                  </div>
                )}
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            onPageChange(Math.max(1, currentPage - 1));
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {(() => {
                        const pages: (number | "ellipsis")[] = [];
                        const showEllipsis = totalPages > 7;

                        if (!showEllipsis) {
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          pages.push(1);

                          if (currentPage <= 4) {
                            for (let i = 2; i <= 5; i++) {
                              pages.push(i);
                            }
                            pages.push("ellipsis");
                            pages.push(totalPages);
                          } else if (currentPage >= totalPages - 3) {
                            pages.push("ellipsis");
                            for (let i = totalPages - 4; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            pages.push("ellipsis");
                            pages.push(currentPage - 1);
                            pages.push(currentPage);
                            pages.push(currentPage + 1);
                            pages.push("ellipsis");
                            pages.push(totalPages);
                          }
                        }

                        return pages.map((item, index) => {
                          if (item === "ellipsis") {
                            return (
                              <PaginationItem key={`ellipsis-${index}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return (
                            <PaginationItem key={item}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  onPageChange(item);
                                }}
                                isActive={item === currentPage}
                                className="cursor-pointer"
                              >
                                {item}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        });
                      })()}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            onPageChange(Math.min(totalPages, currentPage + 1));
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


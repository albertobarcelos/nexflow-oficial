import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardViewTabs } from "./BoardViewTabs";
import { CardSearchBar } from "./CardSearchBar";
import { BoardFilters } from "./BoardFilters";
import type { ViewMode } from "../types";
import type { NexflowCard } from "@/types/nexflow";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import type { User } from "@/hooks/useUsers";
import type { OrganizationTeam } from "@/hooks/useOrganizationTeams";

interface BoardHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onGoBack: () => void;
  flowName?: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchingOnServer: boolean;
  setIsSearchingOnServer: (isSearching: boolean) => void;
  serverSearchResults: NexflowCard[];
  setServerSearchResults: (results: NexflowCard[]) => void;
  searchCardsOnServer?: (query: string, stepId: string) => Promise<NexflowCard[]>;
  steps: NexflowStepWithFields[];
  filterUserId: string | null;
  filterTeamId: string | null;
  setFilterUserId: (userId: string | null) => void;
  setFilterTeamId: (teamId: string | null) => void;
  users: User[];
  teams: OrganizationTeam[];
}

export function BoardHeader({
  viewMode,
  onViewModeChange,
  onGoBack,
  flowName,
  searchQuery,
  setSearchQuery,
  isSearchingOnServer,
  setIsSearchingOnServer,
  serverSearchResults,
  setServerSearchResults,
  searchCardsOnServer,
  steps,
  filterUserId,
  filterTeamId,
  setFilterUserId,
  setFilterTeamId,
  users,
  teams,
}: BoardHeaderProps) {
  return (
    <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
      {/* Lado Esquerdo: Breadcrumb e Título */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoBack}
          className="flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors px-2 h-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </Button>
        <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
          EXECUÇÃO DO FLOW
        </span>
        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700"></div>
        <div>
          <h1 className="text-xl font-bold text-neutral-800 dark:text-white leading-tight">
            {flowName ?? "Flow"}
          </h1>
        </div>
      </div>

      {/* Lado Direito: Controles */}
      <div className="flex items-center gap-3">
        <BoardViewTabs viewMode={viewMode} onViewModeChange={onViewModeChange} />
        <div className="flex items-center gap-2">
          <CardSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearchingOnServer={isSearchingOnServer}
            setIsSearchingOnServer={setIsSearchingOnServer}
            serverSearchResults={serverSearchResults}
            setServerSearchResults={setServerSearchResults}
            searchCardsOnServer={searchCardsOnServer}
            steps={steps}
          />
          <BoardFilters
            filterUserId={filterUserId}
            filterTeamId={filterTeamId}
            setFilterUserId={setFilterUserId}
            setFilterTeamId={setFilterTeamId}
            users={users}
            teams={teams}
          />
        </div>
      </div>
    </header>
  );
}


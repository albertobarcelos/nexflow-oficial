import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardViewTabs } from "./BoardViewTabs";
import { CardSearchBar } from "./CardSearchBar";
import { BoardFilters } from "./BoardFilters";
import type { ViewMode } from "../types";
import type { NexflowCard, NexflowStepWithFields } from "@/types/nexflow";
import type { User } from "@/types/database";
import type { Team } from "@/types/entities";

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
  teams: Team[];
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
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight italic">NEXFLOW</span>
            <span className="text-xl font-light text-slate-500 dark:text-slate-400">CRM</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <BoardViewTabs viewMode={viewMode} onViewModeChange={onViewModeChange} />
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
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

      <div className="bg-white dark:bg-slate-900/50 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onGoBack}
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Execução do Flow</div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
              {flowName ?? "Flow"}
            </h1>
          </div>
        </div>
      </div>
    </>
  );
}


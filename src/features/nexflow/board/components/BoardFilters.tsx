import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { User } from "@/hooks/useUsers";
import type { OrganizationTeam } from "@/hooks/useOrganizationTeams";

interface BoardFiltersProps {
  filterUserId: string | null;
  filterTeamId: string | null;
  setFilterUserId: (userId: string | null) => void;
  setFilterTeamId: (teamId: string | null) => void;
  users: User[];
  teams: OrganizationTeam[];
}

export function BoardFilters({
  filterUserId,
  filterTeamId,
  setFilterUserId,
  setFilterTeamId,
  users,
  teams,
}: BoardFiltersProps) {
  const hasActiveFilters = filterUserId !== null || filterTeamId !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-md relative",
            hasActiveFilters && "bg-neutral-100 dark:bg-neutral-800"
          )}
          aria-label="Filtros"
        >
          <Filter className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
          {hasActiveFilters && (
            <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-blue-500 border border-white dark:border-neutral-900" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
            Usuários
          </div>
          <DropdownMenuRadioGroup
            value={filterUserId ?? "all"}
            onValueChange={(value) => setFilterUserId(value === "all" ? null : value)}
          >
            <DropdownMenuRadioItem value="all">
              Todos os usuários
            </DropdownMenuRadioItem>
            {users
              .filter((user) => user.is_active)
              .map((user) => (
                <DropdownMenuRadioItem key={user.id} value={user.id}>
                  {user.name} {user.surname}
                </DropdownMenuRadioItem>
              ))}
          </DropdownMenuRadioGroup>
        </div>

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
            Times
          </div>
          <DropdownMenuRadioGroup
            value={filterTeamId ?? "all"}
            onValueChange={(value) => setFilterTeamId(value === "all" ? null : value)}
          >
            <DropdownMenuRadioItem value="all">
              Todos os times
            </DropdownMenuRadioItem>
            {teams
              .filter((team) => team.is_active)
              .map((team) => (
                <DropdownMenuRadioItem key={team.id} value={team.id}>
                  {team.name}
                </DropdownMenuRadioItem>
              ))}
          </DropdownMenuRadioGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


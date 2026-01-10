import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User } from "@/types/database";
import type { Team } from "@/types/entities";

interface BoardFiltersProps {
  filterUserId: string | null;
  filterTeamId: string | null;
  setFilterUserId: (userId: string | null) => void;
  setFilterTeamId: (teamId: string | null) => void;
  users: User[];
  teams: Team[];
}

export function BoardFilters({
  filterUserId,
  filterTeamId,
  setFilterUserId,
  setFilterTeamId,
  users,
  teams,
}: BoardFiltersProps) {
  return (
    <>
      <Select
        value={filterUserId ?? "all"}
        onValueChange={(value) => setFilterUserId(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[180px] h-9 text-sm">
          <SelectValue placeholder="Filtrar por usuário" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os usuários</SelectItem>
          {users
            .filter((user) => user.is_active)
            .map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} {user.surname}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <Select
        value={filterTeamId ?? "all"}
        onValueChange={(value) => setFilterTeamId(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[180px] h-9 text-sm">
          <SelectValue placeholder="Filtrar por time" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os times</SelectItem>
          {teams
            .filter((team) => team.is_active)
            .map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </>
  );
}


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentClientId } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  id: string;
  name: string | null;
  surname: string | null;
  email: string;
  role: string;
  avatar_url?: string | null;
  custom_avatar_url?: string | null;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  members: TeamMember[];
}

export function TeamSettings() {
  const clientId = useClientStore((s) => s.currentClient?.id);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      return user;
    },
  });

  const { data: teams, isLoading } = useQuery({
    queryKey: ['user-teams', clientId, user?.id],
    enabled: !!clientId && !!user?.id,
    queryFn: async (): Promise<Team[]> => {
      if (!user?.id) return [];

      const cid = clientId ?? (await getCurrentClientId());
      if (!cid) return [];

      // Buscar times do usuário
      const result = await (supabase
        .from('core_team_members' as any)
        .select('team_id, role, core_teams:team_id(id, name, description, client_id)')
        .eq('user_profile_id', user.id)) as unknown as {
        data: Array<{
          team_id: string;
          role: string;
          core_teams: {
            id: string;
            name: string;
            description: string | null;
            client_id: string;
          } | null;
        }> | null;
        error: any;
      };
      
      const { data: teamMembers, error: teamMembersError } = result;

      if (teamMembersError || !teamMembers) {
        console.error('Erro ao buscar times:', teamMembersError);
        return [];
      }

      // Buscar membros de cada time
      const teamsWithMembers = await Promise.all(
        teamMembers.map(async (tm: any) => {
          const team = tm.core_teams;
          if (!team || team.client_id !== cid) return null;

          const membersResult = await (supabase
            .from('core_team_members' as any)
            .select(`
              user_profile_id,
              role,
              core_client_users:user_profile_id (
                id,
                name,
                surname,
                email,
                role,
                avatar_url,
                custom_avatar_url
              )
            `)
            .eq('team_id', team.id)) as unknown as {
            data: Array<{
              user_profile_id: string;
              role: string;
              core_client_users: {
                id: string;
                name: string | null;
                surname: string | null;
                email: string;
                role: string;
                avatar_url: string | null;
                custom_avatar_url: string | null;
              } | null;
            }> | null;
            error: any;
          };
          
          const { data: members, error: membersError } = membersResult;

          if (membersError || !members) {
            console.error('Erro ao buscar membros:', membersError);
            return null;
          }

          const processedMembers: TeamMember[] = (members || [])
            .map((m: any) => {
              const user = m.core_client_users;
              if (!user) return null;
              return {
                id: user.id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                role: m.role,
                avatar_url: user.avatar_url,
                custom_avatar_url: user.custom_avatar_url,
              };
            })
            .filter((m: TeamMember | null) => m !== null) as TeamMember[];

          return {
            id: team.id,
            name: team.name,
            description: team.description,
            members: processedMembers,
          };
        })
      );

      return teamsWithMembers.filter((t): t is Team => t !== null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Equipe</h2>
          <p className="text-muted-foreground">
            Visualize os times dos quais você faz parte
          </p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Você não faz parte de nenhum time no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Equipe</h2>
        <p className="text-muted-foreground">
          Visualize os times dos quais você faz parte
        </p>
      </div>

      <div className="space-y-4">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <CardTitle>{team.name}</CardTitle>
              {team.description && (
                <p className="text-sm text-muted-foreground">{team.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">
                  Membros ({team.members.length})
                </div>
                <div className="space-y-2">
                  {team.members.map((member) => {
                    const displayName = member.name && member.surname
                      ? `${member.name} ${member.surname}`
                      : member.name || member.email;
                    const initials = member.name && member.surname
                      ? `${member.name[0]}${member.surname[0]}`
                      : member.name?.[0] || member.email[0]?.toUpperCase() || 'U';

                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={member.custom_avatar_url || member.avatar_url || undefined}
                            alt={displayName}
                          />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{displayName}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                        <Badge variant="secondary">{member.role}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

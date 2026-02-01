import { useState } from "react";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamLevelsManager } from "./TeamLevelsManager";
import { TeamMembersAndLevelsManager } from "./TeamMembersAndLevelsManager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TeamConfigurationPage() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const { data: teams = [], isLoading } = useOrganizationTeams();

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Carregando times...</p>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold">Nenhum time encontrado</p>
        <p className="text-sm text-muted-foreground mt-2">
          Crie um time primeiro para configurar níveis e membros
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuração de Times</h2>
        <p className="text-muted-foreground">
          Gerencie níveis hierárquicos e membros dos times
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Time</CardTitle>
          <CardDescription>
            Escolha o time que deseja configurar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="team-select">Time</Label>
            <Select
              value={selectedTeamId}
              onValueChange={setSelectedTeamId}
            >
              <SelectTrigger id="team-select">
                <SelectValue placeholder="Selecione um time" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} {team.clientName && `(${team.clientName})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedTeamId && selectedTeam && (
        <Tabs defaultValue="levels" className="space-y-4">
          <TabsList>
            <TabsTrigger value="levels">Níveis do Time</TabsTrigger>
            <TabsTrigger value="members">Membros e Níveis</TabsTrigger>
          </TabsList>

          <TabsContent value="levels" className="space-y-4">
            <TeamLevelsManager
              teamId={selectedTeamId}
              teamName={selectedTeam.name}
            />
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <TeamMembersAndLevelsManager
              teamId={selectedTeamId}
              teamName={selectedTeam.name}
            />
          </TabsContent>
        </Tabs>
      )}

      {!selectedTeamId && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Selecione um time acima para começar a configurar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

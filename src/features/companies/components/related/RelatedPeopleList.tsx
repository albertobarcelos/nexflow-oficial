import { useCompanyRelationships } from "@/features/companies/hooks/useCompanyRelationships";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

interface RelatedPeopleListProps {
  companyId: string;
}

export function RelatedPeopleList({ companyId }: RelatedPeopleListProps) {
  const { relatedPeople, removeRelationship } = useCompanyRelationships(companyId);

  const handleRemove = async (relationshipId: string) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja remover este relacionamento?"
    );
    if (confirmed) {
      try {
        await removeRelationship.mutateAsync(relationshipId);
        toast.success("Relacionamento removido com sucesso!");
      } catch (error) {
        console.error("Erro ao remover relacionamento:", error);
        toast.error("Erro ao remover relacionamento");
      }
    }
  };

  if (!relatedPeople?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma pessoa relacionada encontrada
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {relatedPeople.map((relationship) => (
        <Card key={relationship.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg font-medium">
                {relationship.person.name}
              </CardTitle>
              <CardDescription>
                {relationship.person.email || "Sem e-mail"}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleRemove(relationship.id)}
                >
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="grid gap-1">
              {relationship.person.phone && (
                <p className="text-sm text-muted-foreground">
                  Telefone: {relationship.person.phone}
                </p>
              )}
              {relationship.person.role && (
                <p className="text-sm text-muted-foreground">
                  Cargo: {relationship.person.role}
                </p>
              )}
              {relationship.person.department && (
                <p className="text-sm text-muted-foreground">
                  Departamento: {relationship.person.department}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 

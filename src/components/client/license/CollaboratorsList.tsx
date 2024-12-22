import { Users } from "lucide-react";

interface CollaboratorsListProps {
  collaborators: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

export function CollaboratorsList({ collaborators }: CollaboratorsListProps) {
  return (
    <div className="rounded-md border">
      <div className="flex items-center p-4 border-b">
        <Users className="mr-2 h-4 w-4" />
        <h4 className="font-medium">Colaboradores</h4>
      </div>
      <div className="divide-y">
        {collaborators?.map((collaborator) => (
          <div key={collaborator.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{collaborator.name}</p>
              <p className="text-sm text-muted-foreground">{collaborator.email}</p>
            </div>
            <span className="text-sm bg-muted px-2 py-1 rounded-full">
              {collaborator.role === 'closer' && 'Closer'}
              {collaborator.role === 'partnership_director' && 'Diretor de Parcerias'}
              {collaborator.role === 'partner' && 'Parceiro'}
            </span>
          </div>
        ))}
        {(!collaborators || collaborators.length === 0) && (
          <p className="p-4 text-sm text-muted-foreground">
            Nenhum colaborador cadastrado
          </p>
        )}
      </div>
    </div>
  );
}
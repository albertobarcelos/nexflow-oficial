import { Building2, Contact, Users, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const entities = [
  {
    id: "companies",
    label: "Empresas",
    icon: Building2,
  },
  {
    id: "people",
    label: "Pessoas",
    icon: Users,
  },
  {
    id: "partners",
    label: "Parceiros",
    icon: Handshake,
  },
];

interface EntitySelectorProps {
  selectedEntityId: string | null;
  onSelectEntity: (entityId: string) => void;
}

export function EntitySelector({ selectedEntityId, onSelectEntity }: EntitySelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entidades</CardTitle>
        <CardDescription>
          Selecione uma entidade para configurar seus campos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {entities.map((entity) => {
          const Icon = entity.icon;
          const isSelected = selectedEntityId === entity.id;

          return (
            <button
              key={entity.id}
              onClick={() => onSelectEntity(entity.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isSelected && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <div>
                <div className="font-medium">{entity.label}</div>
                <div className="text-sm text-muted-foreground">{entity.description}</div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
} 

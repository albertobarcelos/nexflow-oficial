import { Building2, User, Handshake } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface AllowedEntitiesProps {
  value: string[];
  onChange: (entities: string[]) => void;
}

const ENTITY_OPTIONS = [
  {
    id: "companies",
    label: "Empresas",
    description: "Permitir criar negócios vinculados a empresas",
    icon: Building2
  },
  {
    id: "people",
    label: "Pessoas",
    description: "Permitir criar negócios vinculados a pessoas físicas",
    icon: User
  },
  {
    id: "partners",
    label: "Parceiros",
    description: "Permitir criar negócios vinculados a parceiros",
    icon: Handshake
  }
] as const;

export function AllowedEntities({ value = [], onChange }: AllowedEntitiesProps) {
  const handleToggle = (entityId: string) => {
    const newValue = value.includes(entityId)
      ? value.filter(id => id !== entityId)
      : [...value, entityId];
    
    // Garantir que pelo menos uma entidade esteja selecionada
    if (newValue.length > 0) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Entidades Permitidas</div>
      <div className="space-y-3">
        {ENTITY_OPTIONS.map((entity) => {
          const Icon = entity.icon;
          return (
            <div key={entity.id} className="flex items-start space-x-3">
              <Checkbox
                id={`entity-${entity.id}`}
                checked={value.includes(entity.id)}
                onCheckedChange={() => handleToggle(entity.id)}
                disabled={value.length === 1 && value.includes(entity.id)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor={`entity-${entity.id}`}
                  className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <Icon className="h-4 w-4" />
                  {entity.label}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {entity.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 
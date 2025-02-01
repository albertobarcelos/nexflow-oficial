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

interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
}

interface RelatedPeopleListProps {
  people: Person[];
}

export function RelatedPeopleList({ people }: RelatedPeopleListProps) {
  if (!people?.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Nenhuma pessoa relacionada encontrada
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {people.map((person) => (
        <div
          key={person.id}
          className="flex items-center justify-between p-2 rounded-lg border"
        >
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{person.name}</span>
              {person.email && (
                <span className="text-sm text-muted-foreground">
                  {person.email}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

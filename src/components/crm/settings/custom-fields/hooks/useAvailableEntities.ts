import { useQuery } from "@tanstack/react-query";
import { Building2, Contact, Users } from "lucide-react";

const FIXED_ENTITIES = [
  {
    type: "companies",
    name: "Empresas",
    icon: Building2,
    description: "Gerencie informações sobre empresas"
  },
  {
    type: "contacts",
    name: "Contatos",
    icon: Contact,
    description: "Gerencie informações sobre contatos"
  },
  {
    type: "partners",
    name: "Parceiros",
    icon: Users,
    description: "Gerencie informações sobre parceiros"
  }
] as const;

export function useAvailableEntities() {
  const { data: entities = FIXED_ENTITIES, isLoading } = useQuery({
    queryKey: ["entities"],
    queryFn: async () => FIXED_ENTITIES,
  });

  return {
    entities,
    isLoading,
  };
} 

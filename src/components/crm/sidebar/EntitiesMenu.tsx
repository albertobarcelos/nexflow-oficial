import { useLocation, useNavigate } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { SidebarMenuItem } from "./SidebarMenuItem";

interface EntitiesMenuProps {
  entities: {
    id: string;
    name: string;
    icon: LucideIcon;
    description: string;
  }[];
}

export function EntitiesMenu({ entities }: EntitiesMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {entities.map((entity) => (
        <SidebarMenuItem
          key={entity.id}
          title={entity.name}
          href={`/crm/${entity.id}`}
          icon={entity.icon}
          isActive={location.pathname === `/crm/${entity.id}`}
          onClick={() => navigate(`/crm/${entity.id}`)}
        />
      ))}
    </>
  );
} 

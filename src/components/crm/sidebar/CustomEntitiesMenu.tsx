import { useLocation, useNavigate } from "react-router-dom";
import { Users, Building2, Contact } from "lucide-react";
import { SidebarMenuItem } from "./SidebarMenuItem";
import type { CustomEntity } from "@/types/database/entity";

interface CustomEntitiesMenuProps {
  entities: CustomEntity[];
}

const getDefaultIcon = (templateName: string | null) => {
  switch (templateName) {
    case 'company':
      return Building2;
    case 'contact':
      return Contact;
    default:
      return Users;
  }
};

export function CustomEntitiesMenu({ entities }: CustomEntitiesMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {entities.map((entity) => (
        <SidebarMenuItem
          key={entity.id}
          title={entity.name}
          href={`/crm/entities/${entity.id}`}
          icon={getDefaultIcon(entity.template_name)}
          isActive={location.pathname === `/crm/entities/${entity.id}`}
          onClick={() => navigate(`/crm/entities/${entity.id}`)}
        />
      ))}
    </>
  );
}
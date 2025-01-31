import { useLocation, useNavigate } from "react-router-dom";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { KanbanSquare } from "lucide-react";

interface PipelinesMenuProps {
  pipelines: {
    id: string;
    name: string;
  }[];
}

export function PipelinesMenu({ pipelines }: PipelinesMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {pipelines.map((pipeline) => (
        <SidebarMenuItem
          key={pipeline.id}
          title={pipeline.name}
          href={`/crm/pipelines/${pipeline.id}`}
          icon={KanbanSquare}
          isActive={location.pathname === `/crm/pipelines/${pipeline.id}`}
          onClick={() => navigate(`/crm/pipelines/${pipeline.id}`)}
        />
      ))}
    </>
  );
} 

import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Kanban, CheckSquare, BarChart, Settings, Workflow, Eye, Building2, Users, DollarSign } from "lucide-react";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { PipelineSelector } from "../pipeline/PipelineSelector";

interface MainMenuItemsProps {
  showPipelineSelector: boolean;
  setShowPipelineSelector: (show: boolean) => void;
  pipelines: any[];
}

export function MainMenuItems({ showPipelineSelector, setShowPipelineSelector, pipelines }: MainMenuItemsProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const baseMenuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/crm/dashboard",
    },
    {
      title: "Pipelines",
      icon: Kanban,
      href: "/crm/opportunities",
      showSelector: true,
    },
    {
      title: "Tarefas",
      icon: CheckSquare,
      href: "/crm/tasks",
    },
    // AIDEV-NOTE: Bases fixas do sistema - substituem entidades dinâmicas
    {
      title: "Empresas",
      icon: Building2,
      href: "/crm/companies",
    },
    {
      title: "Pessoas",
      icon: Users,
      href: "/crm/people",
    },
    {
      title: "Negócios",
      icon: DollarSign,
      href: "/crm/deals",
    },
    {
      title: "Construtor de Flows",
      icon: Workflow,
      href: "/crm/flows/builder",
    },
    {
      title: "Visualizações de Flows",
      icon: Eye,
      href: "/crm/flows/views",
    },
    {
      title: "Relatórios",
      icon: BarChart,
      href: "/crm/reports",
    },
    {
      title: "Configurações",
      icon: Settings,
      href: "/crm/settings",
    },
  ];

  const isActive = (href: string) => {
    if (href === '/crm/opportunities') {
      return location.pathname.startsWith(href);
    }
    return location.pathname === href;
  };

  const handleMenuClick = async (href: string, showSelector: boolean) => {
    if (showSelector) {
      if (pipelines?.length === 1) {
        navigate(`/crm/opportunities/${pipelines[0].id}`);
      } else if (pipelines?.length > 1) {
        setShowPipelineSelector(!showPipelineSelector);
      }
      return;
    }
    navigate(href);
  };

  return (
    <>
      {baseMenuItems.map((item) => (
        <div key={item.href}>
          <SidebarMenuItem
            title={item.title}
            href={item.href}
            icon={item.icon}
            isActive={isActive(item.href)}
            onClick={() => handleMenuClick(item.href, item.showSelector || false)}
          />
          {item.showSelector && showPipelineSelector && pipelines?.length > 1 && (
            <PipelineSelector 
              onSelect={(id) => {
                navigate(`/crm/opportunities/${id}`);
                setShowPipelineSelector(false);
              }} 
            />
          )}
        </div>
      ))}
    </>
  );
}

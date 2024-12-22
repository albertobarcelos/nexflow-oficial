import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { useEntityNames } from "@/hooks/useEntityNames";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Kanban,
  CheckSquare,
  BarChart,
  Settings,
  Menu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PipelineSelector } from "./pipeline/PipelineSelector";
import { SidebarMenuItem } from "./sidebar/SidebarMenuItem";
import { SidebarLogoutButton } from "./sidebar/SidebarLogoutButton";
import { SidebarHeader } from "./sidebar/SidebarHeader";

const getMenuItems = (leadSingular: string, leadPlural: string) => [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/crm/dashboard",
  },
  {
    title: leadPlural,
    icon: Users,
    href: "/crm/leads",
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

export function CRMSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, setOpen, isMobile } = useSidebar();
  const [showPipelineSelector, setShowPipelineSelector] = useState(false);
  const { leadSingular, leadPlural } = useEntityNames();
  const menuItems = getMenuItems(leadSingular, leadPlural);

  const { data: pipelines } = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data } = await supabase
        .from('pipeline_configs')
        .select('*')
        .eq('client_id', collaborator.client_id);

      return data;
    }
  });

  const isActive = (href: string) => {
    if (href === '/crm/opportunities') {
      return location.pathname.startsWith(href);
    }
    return location.pathname === href;
  };

  const handleMenuClick = async (href: string, showSelector: boolean) => {
    if (showSelector) {
      if (pipelines?.length === 1) {
        // Se houver apenas um pipeline, navega diretamente para ele
        navigate(`/crm/opportunities/${pipelines[0].id}`);
      } else if (pipelines?.length > 1) {
        // Se houver múltiplos pipelines, alterna a visibilidade do seletor
        setShowPipelineSelector(!showPipelineSelector);
      }
      return;
    }
    navigate(href);
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-20 bg-black/80 lg:hidden",
          state === "expanded" ? "block" : "hidden"
        )}
        onClick={() => setOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-20 flex h-screen w-64 flex-col bg-white transition-transform duration-300 lg:static lg:translate-x-0 dark:bg-gray-900",
          state === "expanded" ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarHeader onClose={() => setOpen(false)} />

        <div className="flex-1 overflow-auto">
          <nav className="flex-1 space-y-1 p-2">
            {menuItems.map((item) => (
              <div key={item.href}>
                <SidebarMenuItem
                  title={item.title}
                  href={item.href}
                  icon={item.icon}
                  isActive={isActive(item.href)}
                  onClick={() => handleMenuClick(item.href, item.showSelector)}
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
          </nav>
        </div>

        <SidebarLogoutButton />
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-4 z-30 lg:hidden"
        onClick={() => setOpen(state !== "expanded")}
      >
        <Menu className="h-6 w-6" />
      </Button>
    </>
  );
}
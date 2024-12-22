import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Users,
  Kanban,
  CheckSquare,
  BarChart,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { PipelineSelector } from "./pipeline/PipelineSelector";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/crm/dashboard",
  },
  {
    title: "Leads",
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/crm/login");
  };

  const isActive = (href: string) => {
    if (href === '/crm/opportunities') {
      return location.pathname.startsWith(href);
    }
    return location.pathname === href;
  };

  const handlePipelineSelect = (pipelineId: string) => {
    navigate(`/crm/opportunities/${pipelineId}`);
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
        <div className="flex h-14 items-center justify-between px-4 border-b">
          <span className="text-lg font-semibold">Portal CRM</span>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(false)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          <nav className="flex-1 space-y-1 p-2">
            {menuItems.map((item) => (
              <div key={item.href}>
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Button>
                {item.showSelector && isActive(item.href) && (
                  <PipelineSelector onSelect={handlePipelineSelect} />
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
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
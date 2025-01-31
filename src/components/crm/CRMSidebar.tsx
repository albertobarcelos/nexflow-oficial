import { useNavigate } from "react-router-dom";
import { LogOut, Building2, Users } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { useSidebarData } from "@/hooks/useSidebarData";
import { Button } from "@/components/ui/button";
import { EntitiesMenu } from "./sidebar/EntitiesMenu";
import { PipelinesMenu } from "./sidebar/PipelinesMenu";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarMenuItem } from "./sidebar/SidebarMenuItem";

export function CRMSidebar() {
  const navigate = useNavigate();
  const { isOpen } = useSidebar();
  const { pipelines, entities } = useSidebarData();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen w-64 -translate-x-full border-r border-border bg-background transition-transform ${
        isOpen ? "translate-x-0" : ""
      }`}
    >
      <div className="flex h-full flex-col overflow-y-auto">
        <SidebarHeader />

        <div className="flex flex-1 flex-col gap-2 p-4">
          <SidebarMenuItem
            title="Dashboard"
            href="/crm/dashboard"
            icon={LogOut}
            onClick={() => navigate("/crm/dashboard")}
          />

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              Oportunidades
            </span>

            <PipelinesMenu pipelines={pipelines} />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              Entidades
            </span>

            <EntitiesMenu entities={entities} />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              Empresas
            </span>

            <SidebarMenuItem
              title="Empresas"
              href="/crm/companies"
              icon={Building2}
              onClick={() => navigate("/crm/companies")}
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              Pessoas
            </span>

            <SidebarMenuItem
              title="Pessoas"
              href="/crm/people"
              icon={Users}
              onClick={() => navigate("/crm/people")}
            />
          </div>
        </div>

        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => navigate("/auth/logout")}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </aside>
  );
}

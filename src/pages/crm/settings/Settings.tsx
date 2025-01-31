import { NavLink, Outlet } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Users,
  Workflow,
  Paintbrush,
  Bell,
  GitBranch,
  SlidersHorizontal,
  Settings as SettingsIcon,
  Building2
} from "lucide-react";

const settingsNavItems = [
  {
    title: "Geral",
    href: "/crm/settings",
    icon: SettingsIcon,
  },
  {
    title: "Equipe",
    href: "/crm/settings/team",
    icon: Users,
  },
  {
    title: "Automações",
    href: "/crm/settings/automation",
    icon: Workflow,
  },
  {
    title: "Personalização",
    href: "/crm/settings/customization",
    icon: Paintbrush,
  },
  {
    title: "Notificações",
    href: "/crm/settings/notifications",
    icon: Bell,
  },
  {
    title: "Pipeline",
    href: "/crm/settings/pipeline",
    icon: GitBranch,
  },
  {
    title: "Campos Personalizados",
    href: "/crm/settings/custom-fields",
    icon: SlidersHorizontal,
  },
  {
    title: "Entidades",
    href: "/crm/settings/entities",
    icon: Building2,
  },
];

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
        </p>
      </div>

      <div className="flex gap-6">
        <Card className="w-64 h-fit">
          <nav className="p-2">
            {settingsNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                    isActive ? "bg-accent" : "transparent"
                  )
                }
                end
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </NavLink>
            ))}
          </nav>
        </Card>

        <Card className="flex-1 p-6">
          <Outlet />
        </Card>
      </div>
    </div>
  );
} 

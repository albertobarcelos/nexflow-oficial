import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, UsersRound, Building2, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    id: "users",
    label: "Usuários",
    icon: Users,
    path: "/crm/configurations/users",
  },
  {
    id: "teams",
    label: "Times",
    icon: UsersRound,
    path: "/crm/configurations/teams",
  },
  {
    id: "units",
    label: "Unidades",
    icon: Building2,
    path: "/crm/configurations/units",
  },
  {
    id: "items",
    label: "Itens Orçamento",
    icon: Package,
    path: "/crm/configurations/items",
  },
];

export function CRMConfigurationsLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex-shrink-0">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Configurações</h2>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

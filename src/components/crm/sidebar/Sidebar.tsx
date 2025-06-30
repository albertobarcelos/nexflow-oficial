import { useNavigate } from "react-router-dom";
import {
  Home,
  CheckSquare,
  Building2,
  Users,
  Handshake,
  DollarSign,
  BarChart3,
  ChevronDown,
  Search,
  Bell,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getFirstFlow } from "@/hooks/useFlows";

const menuItems = [
  {
    title: "Início",
    icon: Home,
    href: "/crm/dashboard",
  },
  {
    title: "Tarefas",
    icon: CheckSquare,
    href: "/crm/tasks",
  },
  {
    title: "Empresas",
    icon: Building2,
    href: "/crm/companies",
  },
  {
    title: "Contatos",
    icon: Users,
    href: "/crm/people",
  },
];

const reportItems = [
  {
    title: "Vendas",
    href: "/crm/reports/sales",
  },
  {
    title: "Atividades",
    href: "/crm/reports/activities",
  },
  {
    title: "Pipeline",
    href: "/crm/reports/pipeline",
  },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/crm/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  const userInitials = user?.email ? getInitials(user.email.split('@')[0]) : 'U';

  return (
    <div className="flex h-14 items-center justify-between px-4 bg-white shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]" >
      <div className="flex items-center gap-4">
        <h1 className="text-xl italic text-blue-950"><strong>NEXFLOW</strong>CRM</h1>
        <div className="flex items-center gap-3">
          {menuItems.map((item) => (
            <Button
              key={item.title}
              variant="ghost"
              className="justify-start gap-2 text-blue-950 hover:bg-blue-950 hover:text-white rounded-full px-3 py-1 text-[13px]"
              onClick={() => item.onClick ? item.onClick(navigate) : navigate(item.href as string)}
            >
              <item.icon className="h-2 w-2" />
              {item.title}
            </Button>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-blue-950 hover:bg-white/10">
                <BarChart3 className="h-4 w-4" />
                Relatórios
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {reportItems.map((item) => (
                <DropdownMenuItem
                  key={item.href}
                  onClick={() => navigate(item.href)}
                >
                  {item.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-64 pl-8 text-white placeholder:text-muted-foreground"
          />
        </div>

        <Button variant="ghost" size="icon" className="text-blue-950 hover:bg-blue-950 hover:text-white">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-primary hover:bg-primary/80"
            >
              <span className="text-sm font-medium text-primary-foreground">
                {userInitials}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.email?.split('@')[0]}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Minha conta
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Novidades
              <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                4
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem>Planos e preços</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Usuários</DropdownMenuItem>
            <DropdownMenuItem>Grupos</DropdownMenuItem>
            <DropdownMenuItem>Equipes</DropdownMenuItem>
            <DropdownMenuItem>Departamentos</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/crm/settings")}>
              Configurações
              <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                Novidade
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem>Integrações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 hover:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 

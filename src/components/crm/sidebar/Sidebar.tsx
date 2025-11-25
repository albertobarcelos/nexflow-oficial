import { useNavigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import {
  Home,
  Building2,
  Users,
  Handshake,
  DollarSign,
  Search,
  Bell,
  Settings,
  LogOut,
  User,
  LucideProps,
  Database,
  Workflow,
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
import { useAccountProfile } from "@/hooks/useAccountProfile";
import { UserAvatar } from "@/components/ui/user-avatar";
// AIDEV-NOTE: Removido useEntities - sistema simplificado sem entidades dinâmicas

interface MenuItem {
  title: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  href: string;
  onClick?: (navigate: (path: string) => void) => void;
}

// Função para buscar detalhes do flow e suas entidades
// AIDEV-NOTE: Função removida durante simplificação - sistema agora foca apenas em deals
// Anteriormente buscava entidades dinâmicas vinculadas aos flows
// Substituída por estrutura simplificada com Companies/People/Deals fixos

// AIDEV-NOTE: Mapeamento de ícones removido - sistema simplificado sem entidades dinâmicas

const baseMenuItems: MenuItem[] = [
  {
    title: "Início",
    icon: Home,
    href: "/crm/dashboard",
  },
  {
    title: "Flows",
    icon: Workflow,
    href: "/crm/flows",
  },
  // AIDEV-NOTE: Empresas e Pessoas aparecem condicionalmente dentro de flows
  // Removido "Negócios" - funcionalidade desnecessária
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
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { user: userProfile, lastUpdate } = useAccountProfile();

  // AIDEV-NOTE: Detecta se estamos dentro de um flow OU nas páginas de Empresas/Pessoas
  const isInsideFlow = location.pathname.includes('/flow/') && params.id;
  const isInCompaniesOrPeople = location.pathname.includes('/companies') || location.pathname.includes('/people');
  
  // AIDEV-NOTE: Menu base sempre visível
  const menuItems = [...baseMenuItems];
  
  // AIDEV-NOTE: Adiciona Empresas e Pessoas quando dentro de um flow OU nas próprias páginas
  if (isInsideFlow || isInCompaniesOrPeople) {
    menuItems.push(
      {
        title: "Empresas",
        icon: Building2,
        href: "/crm/companies",
      },
      {
        title: "Pessoas", 
        icon: Users,
        href: "/crm/people",
      }
    );
  }

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

  

  return (
    <div className="flex h-14 items-center justify-between px-4 bg-white shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]" >
      <div className="flex items-center gap-4">
        <h1 className="text-xl italic text-blue-950"><strong>NEXFLOW</strong>CRM</h1>
        <div className="flex items-center gap-3">
          {menuItems.map((item) => {
            const isActive = item.onClick ? 
              location.pathname + location.search === item.href :
              item.href === '/crm/flows' ? location.pathname.startsWith(item.href) : location.pathname === item.href;
              
            return (
              <Button
                key={item.title}
                variant="ghost"
                className={cn(
                  "justify-start gap-2 text-blue-950 hover:bg-blue-950 hover:text-white rounded-full px-3 py-1 text-[13px]",
                  isActive && "bg-blue-950 text-white"
                )}
                onClick={() => item.onClick ? item.onClick(navigate) : navigate(item.href as string)}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Button>
            );
          })}
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
              className="h-9 w-9 rounded-full"
            >
              <UserAvatar 
                user={userProfile} 
                size="sm" 
                lastUpdate={lastUpdate}
                key={`${userProfile?.avatar_url || ''}-${userProfile?.custom_avatar_url || ''}-${userProfile?.avatar_seed || ''}-${userProfile?.avatar_type || ''}-${lastUpdate}`} 
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/crm/account/profile')}>
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/crm/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

import { useNavigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import {
  Home,
  Building2,
  Users,
  Handshake,
  DollarSign,
  Bell,
  LogOut,
  User,
  LucideProps,
  Database,
  Workflow,
  Target,
  Sparkles,
  Settings,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { useHuntersAccess } from "@/hooks/useHuntersAccess";
import { useOpportunitiesAccess } from "@/hooks/useOpportunitiesAccess";
import { NotificationBell } from "@/components/crm/notifications/NotificationBell";
import { GlobalSearchBar } from "@/components/crm/sidebar/GlobalSearchBar";
import { Logo } from "@/components/ui/logo";
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
  {
    title: "Calendário",
    icon: Calendar,
    href: "/crm/calendar",
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
  const { hasAccess: hasHuntersAccess } = useHuntersAccess();
  const { hasAccess: hasOpportunitiesAccess } = useOpportunitiesAccess();

  // AIDEV-NOTE: Detecta se estamos dentro de um flow
  const isInsideFlow = location.pathname.includes('/flow/') && params.id;
  // Verifica se está nas páginas específicas de Empresas ou Pessoas (não em relações)
  const isInCompaniesPage = location.pathname === '/crm/companies';
  const isInPeoplePage = location.pathname === '/crm/people';
  
  // AIDEV-NOTE: Menu base sempre visível
  const menuItems = [...baseMenuItems];
  
  // AIDEV-NOTE: Adiciona Empresas e Pessoas apenas quando dentro de um flow OU nas páginas específicas
  if (isInsideFlow || isInCompaniesPage || isInPeoplePage) {
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

  // Adiciona Contatos se o usuário tiver acesso
  if (hasOpportunitiesAccess) {
    menuItems.push({
      title: "Contatos",
      icon: Users,
      href: "/crm/contacts",
    });
  }

  // Adiciona Empresas (Relações)
  menuItems.push({
    title: "Empresas",
    icon: Building2,
    href: "/crm/companies/relations",
  });

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
    <div className="flex h-14 items-center justify-between px-4 bg-background border-b border-border shadow-sm" >
      <div className="flex items-center gap-4">
        <Logo />
        <div className="flex items-center gap-3">
          {menuItems.map((item) => {
            const isActive = item.onClick ? 
              location.pathname + location.search === item.href :
              (item.href === '/crm/flows' || item.href === '/crm/contacts' || item.href === '/crm/calendar') ? location.pathname.startsWith(item.href) : location.pathname === item.href;
              
            return (
              <Button
                key={item.title}
                variant="ghost"
                className={cn(
                  "justify-start gap-2 text-foreground hover:bg-primary hover:text-primary-foreground rounded-full px-3 py-1 text-[13px]",
                  isActive && "bg-primary text-primary-foreground"
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
        <GlobalSearchBar />

        <NotificationBell />

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
            <DropdownMenuItem onClick={() => navigate('/crm/configurations')}>
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

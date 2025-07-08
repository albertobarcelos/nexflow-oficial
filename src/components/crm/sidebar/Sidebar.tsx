import { useNavigate, useLocation, useParams, useSearchParams } from "react-router-dom";
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
  LucideProps,
  Database,
  Eye,
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
import { useQuery } from "@tanstack/react-query";
import { useEntities } from "@/hooks/useEntities";

interface MenuItem {
  title: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  href: string;
  onClick?: (navigate: (path: string) => void) => void;
}

// Função para buscar detalhes do flow e suas entidades
const getFlowWithEntities = async (flowId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  if (!clientUser) throw new Error('Usuário sem cliente associado');

  // Buscar o flow
  const { data: flow, error: flowError } = await supabase
    .from('web_flows')
    .select('*')
    .eq('id', flowId)
    .eq('client_id', clientUser.client_id)
    .single();

  if (flowError) throw flowError;

  // Buscar entidades vinculadas usando a tabela web_flow_entity_links
  const { data: linkedEntities, error: entitiesError } = await supabase
    .from('web_flow_entity_links')
    .select(`
      *,
      entity:web_entities!web_flow_entity_links_entity_id_fkey (
        id,
        name,
        icon,
        description,
        color,
        is_system
      )
    `)
    .eq('flow_id', flowId)
    .eq('client_id', clientUser.client_id)
    .order('order_index');

  if (entitiesError) {
    console.error('Erro ao buscar entidades vinculadas:', entitiesError);
    // Se der erro, retornar flow sem entidades
    return { flow, entities: [] };
  }

  // Extrair apenas as entidades dos resultados
  const entities = linkedEntities?.map(link => link.entity).filter(Boolean) || [];

  return { flow, entities };
};

// Ícones para entidades
const getEntityIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'database': Database,
    'building2': Building2,
    'users': Users,
    'package': BarChart3,
    'home': Home,
    'car': DollarSign,
    'graduation-cap': CheckSquare,
    'briefcase': Building2,
    'heart': Users,
    'shopping-cart': BarChart3,
    'handshake': Handshake,
    'user-check': User,
    'credit-card': DollarSign,
    'book-open': CheckSquare,
  };
  return iconMap[iconName] || Database;
};

const baseMenuItems: MenuItem[] = [
  {
    title: "Início",
    icon: Home,
    href: "/crm/dashboard",
  },
  {
    title: "Visão Geral",
    icon: Eye,
    href: "/crm/overview",
  },
  {
    title: "Tarefas",
    icon: CheckSquare,
    href: "/crm/tasks",
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
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Detectar se estamos em um flow ou numa entidade que veio de um flow
  const isInFlow = location.pathname.startsWith('/crm/flow/') && params.id;
  const isInEntityFromFlow = location.pathname.startsWith('/crm/entity/') && searchParams.get('flow');
  const flowId = isInFlow ? params.id : searchParams.get('flow');

  // Detectar se devemos mostrar o contexto do flow
  const shouldShowFlowContext = isInFlow || isInEntityFromFlow;

  // Buscar dados do flow e entidades se estivermos em contexto de flow
  const { data: flowData } = useQuery({
    queryKey: ['flow-entities', flowId],
    queryFn: () => getFlowWithEntities(flowId!),
    enabled: !!shouldShowFlowContext && !!flowId,
  });

  // Construir menu dinâmico
  const menuItems = [...baseMenuItems];

  // Se estivermos em contexto de flow, modificar o menu
  if (shouldShowFlowContext && flowData?.flow) {
    // Substituir "Início" por "Painel" que volta para o flow
    menuItems[0] = {
      title: "Painel",
      icon: Eye,
      href: `/crm/flow/${flowId}`,
    };

    // Adicionar entidades vinculadas ao flow
    if (flowData.entities && flowData.entities.length > 0) {
      flowData.entities.forEach((entity: any) => {
        const EntityIcon = getEntityIcon(entity.icon);
        const isCurrentEntity = location.pathname.includes(`/crm/entity/${entity.id}`) && searchParams.get('flow') === flowId;
        
        menuItems.push({
          title: entity.name,
          icon: EntityIcon,
          href: `/crm/entity/${entity.id}?flow=${flowId}`,
          onClick: (navigate) => {
            // Navegar para a entidade com query parameter do flow
            navigate(`/crm/entity/${entity.id}?flow=${flowId}`);
          }
        });
      });
    }
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

  const userInitials = user?.email ? getInitials(user.email.split('@')[0]) : 'U';

  return (
    <div className="flex h-14 items-center justify-between px-4 bg-white shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]" >
      <div className="flex items-center gap-4">
        <h1 className="text-xl italic text-blue-950"><strong>NEXFLOW</strong>CRM</h1>
        <div className="flex items-center gap-3">
          {menuItems.map((item) => {
            const isActive = item.onClick ? 
              location.pathname + location.search === item.href :
              location.pathname === item.href;
              
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
            <DropdownMenuItem onClick={() => navigate("/crm/account/profile")}>
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

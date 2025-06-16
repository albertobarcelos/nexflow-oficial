import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  List,
  DollarSign,
  FileText,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ResellerData {
  id: string;
  reseller_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  reseller: {
    id: string;
    name: string;
    company_name: string;
  };
}

export function ResellerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [resellerData, setResellerData] = useState<ResellerData | null>(null);
  const [clientsOpen, setClientsOpen] = useState(false);

  useEffect(() => {
    const fetchResellerData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('core_reseller_users')
          .select(`
            id,
            reseller_id,
            first_name,
            last_name,
            email,
            role,
            reseller:core_resellers!reseller_id (
              id,
              name,
              company_name
            )
          `)
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        setResellerData(data);
      } catch (error) {
        console.error('Erro ao buscar dados do revendedor:', error);
      }
    };

    fetchResellerData();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso!");
      navigate("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: BarChart3,
      path: "/reseller",
      exact: true,
    },
    {
      title: "Clientes",
      icon: Users,
      path: "/reseller/clients",
      submenu: [
        {
          title: "Listar Clientes",
          icon: List,
          path: "/reseller/clients",
        },
        {
          title: "Novo Cliente",
          icon: Plus,
          path: "/reseller/clients/new",
        },
      ],
    },
    {
      title: "Comissões",
      icon: DollarSign,
      path: "/reseller/commissions",
    },
    {
      title: "Relatórios",
      icon: FileText,
      path: "/reseller/reports",
    },
    {
      title: "Configurações",
      icon: Settings,
      path: "/reseller/settings",
    },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Sidebar className="border-r border-gray-200 bg-white">
      <SidebarHeader className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">
              Portal Revendedor
            </h2>
            <p className="text-sm text-gray-500 truncate">
              {resellerData?.reseller?.company_name || 'Carregando...'}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              {item.submenu ? (
                <Collapsible
                  open={item.title === "Clientes" ? clientsOpen : false}
                  onOpenChange={item.title === "Clientes" ? setClientsOpen : undefined}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={`w-full justify-between ${
                        isActive(item.path) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${
                        (item.title === "Clientes" && clientsOpen) ? 'rotate-180' : ''
                      }`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.submenu.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.path}>
                          <SidebarMenuSubButton
                            onClick={() => navigate(subItem.path)}
                            className={`w-full ${
                              isActive(subItem.path, true) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <subItem.icon className="w-4 h-4" />
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuButton
                  onClick={() => navigate(item.path)}
                  className={`w-full ${
                    isActive(item.path, item.exact) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-4">
        {resellerData && (
          <div className="space-y-4">
            {/* Perfil do Usuário */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Avatar className="w-10 h-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-blue-600 text-white text-sm">
                  {getInitials(resellerData.first_name, resellerData.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {resellerData.first_name} {resellerData.last_name}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {resellerData.role === 'owner' ? 'Proprietário' : 
                   resellerData.role === 'manager' ? 'Gerente' : 'Visualizador'}
                </p>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/reseller/profile")}
                className="w-full justify-start text-gray-700 hover:bg-gray-50"
              >
                <User className="w-4 h-4 mr-2" />
                Meu Perfil
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
} 
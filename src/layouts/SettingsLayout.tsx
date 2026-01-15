import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Users, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/crm/login");
          return;
        }

        // Verificar se é o usuário de teste
        if (session.user.email === 'barceloshd@gmail.com') {
          setLoading(false);
          return;
        }

        // Verificar se o usuário tem acesso ao CRM
        const { data: userData, error } = await supabase
          .from('core_client_users')
          .select(`
            id,
            client_id,
            email,
            role,
            is_active,
            client:core_clients!client_id (
              id,
              name,
              company_name,
              status
            )
          `)
          .eq('id', session.user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (error || !userData) {
          console.error('Erro ao verificar acesso:', error);
          navigate("/crm/login");
          return;
        }

        if (userData.client?.status !== 'active') {
          console.error('Cliente não está ativo');
          navigate("/crm/login");
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        navigate("/crm/login");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [navigate]);

  const settingsMenuItems = [
    {
      title: "Geral",
      description: "Configurações gerais do sistema",
      icon: Settings,
      path: "/crm/settings",
      exact: true,
    },
    {
      title: "Notificações",
      description: "Configurar alertas e notificações",
      icon: Bell,
      path: "/crm/settings/notifications",
    },
    {
      title: "Equipe",
      description: "Visualizar equipes que você faz parte",
      icon: Users,
      path: "/crm/settings/team",
    },
    {
      title: "Perfil",
      description: "Editar avatar, nome e senha",
      icon: User,
      path: "/crm/settings/profile",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Carregando configurações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/crm')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as configurações do seu CRM
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Menu Lateral */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Menu de Configurações</CardTitle>
                <CardDescription>
                  Selecione uma categoria para configurar
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {settingsMenuItems.map((item) => {
                    const isActive = item.exact 
                      ? location.pathname === item.path 
                      : location.pathname.startsWith(item.path);
                    
                    return (
                      <Button
                        key={item.path}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-auto p-4 text-left",
                          isActive && "bg-primary/10 hover:bg-primary/20"
                        )}
                        onClick={() => navigate(item.path)}
                      >
                        <div className="flex items-start gap-3">
                          <item.icon className={cn(
                            "w-5 h-5 mt-0.5",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )} />
                          <div className="flex-1">
                            <div className={cn(
                              "font-medium",
                              isActive ? "text-primary" : "text-foreground"
                            )}>{item.title}</div>
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
} 
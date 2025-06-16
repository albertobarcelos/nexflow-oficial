import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Users, Bell, Palette, Database, Workflow, Zap, Sliders } from "lucide-react";

export function SettingsLayout() {
  const navigate = useNavigate();
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
            first_name,
            last_name,
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
      title: "Equipe",
      description: "Gerenciar usuários e permissões",
      icon: Users,
      path: "/crm/settings/team",
    },
    {
      title: "Automação",
      description: "Configurar automações e workflows",
      icon: Workflow,
      path: "/crm/settings/automation",
    },
    {
      title: "Personalização",
      description: "Personalizar aparência e layout",
      icon: Palette,
      path: "/crm/settings/customization",
    },
    {
      title: "Notificações",
      description: "Configurar alertas e notificações",
      icon: Bell,
      path: "/crm/settings/notifications",
    },
    {
      title: "Pipeline",
      description: "Configurar funis e etapas",
      icon: Zap,
      path: "/crm/settings/pipeline",
    },
    {
      title: "Campos Personalizados",
      description: "Criar e gerenciar campos customizados",
      icon: Sliders,
      path: "/crm/settings/custom-fields",
    },
    {
      title: "Entidades",
      description: "Configurar entidades do sistema",
      icon: Database,
      path: "/crm/settings/entities",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Carregando configurações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-1">
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
                  {settingsMenuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant="ghost"
                      className="w-full justify-start h-auto p-4 text-left"
                      onClick={() => navigate(item.path)}
                    >
                      <div className="flex items-start gap-3">
                        <item.icon className="w-5 h-5 mt-0.5 text-gray-500" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-500">{item.description}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
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
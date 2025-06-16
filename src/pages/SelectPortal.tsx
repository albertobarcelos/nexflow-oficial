import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Building2, Users } from "lucide-react";

export function SelectPortal() {
  const navigate = useNavigate();

  const portals = [
    {
      title: "Portal Administrativo",
      description: "Gerencie todos os clientes e configurações do sistema",
      path: "/admin/login",
      color: "bg-blue-500",
      icon: Shield,
    },
    {
      title: "Portal CRM",
      description: "Gerencie negócios, contatos e oportunidades",
      path: "/crm/login",
      color: "bg-green-500",
      icon: Building2,
    },
    {
      title: "Portal do Revendedor",
      description: "Gerencie seus clientes e acompanhe comissões",
      path: "/reseller/login",
      color: "bg-purple-500",
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-5xl w-full p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Selecione o Portal</h1>
          <p className="text-lg text-gray-600">Escolha o portal adequado para sua função</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {portals.map((portal) => (
            <Card 
              key={portal.path}
              className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:scale-105"
              onClick={() => navigate(portal.path)}
            >
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 rounded-2xl ${portal.color} mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                  <portal.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">{portal.title}</CardTitle>
                <CardDescription className="text-gray-600 text-sm leading-relaxed">
                  {portal.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(portal.path);
                  }}
                >
                  Acessar Portal
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Problemas para acessar? Entre em contato com o suporte técnico
          </p>
        </div>
      </div>
    </div>
  );
} 

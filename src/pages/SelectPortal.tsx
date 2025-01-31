import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SelectPortal() {
  const navigate = useNavigate();

  const portals = [
    {
      title: "Portal Administrativo",
      description: "Gerencie todos os clientes e configurações do sistema",
      path: "/admin/login",
      color: "bg-blue-500",
    },
    {
      title: "Portal CRM",
      description: "Gerencie negócios, contatos e oportunidades",
      path: "/crm/login",
      color: "bg-green-500",
    },
    {
      title: "Portal do Parceiro",
      description: "Acompanhe indicações e resultados",
      path: "/partner/login",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-4xl w-full p-8">
        <h1 className="text-4xl font-bold text-center mb-12">Selecione o Portal</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {portals.map((portal) => (
            <Card 
              key={portal.path}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(portal.path)}
            >
              <CardHeader>
                <div className={`w-16 h-16 rounded-full ${portal.color} mb-4`} />
                <CardTitle>{portal.title}</CardTitle>
                <CardDescription>{portal.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => navigate(portal.path)}>
                  Acessar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 

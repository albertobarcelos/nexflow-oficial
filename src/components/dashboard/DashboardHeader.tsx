import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function DashboardHeader() {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao Portal Administrador OEM Nexsyn
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => navigate('/admin/clients/new')}>
          Novo Cliente
        </Button>
        <Button variant="outline" onClick={() => navigate('/admin/reports')}>
          Ver Relatórios
        </Button>
      </div>
    </div>
  );
}

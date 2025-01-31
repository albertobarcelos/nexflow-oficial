import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <h1 className="text-4xl font-bold text-blue-900 mb-8">Bem-vindo ao Sistema Nexsyn</h1>
      <div className="grid gap-4 md:grid-cols-3 max-w-4xl w-full">
        <Button
          className="h-32 text-lg font-semibold"
          onClick={() => navigate("/admin/login")}
        >
          Portal Administrador
          <br />
          <span className="text-sm font-normal">OEM Nexsyn</span>
        </Button>
        
        <Button
          className="h-32 text-lg font-semibold"
          onClick={() => navigate("/crm/login")}
        >
          Portal CRM
          <br />
          <span className="text-sm font-normal">Colaboradores</span>
        </Button>
        
        <Button
          className="h-32 text-lg font-semibold"
          onClick={() => navigate("/partner/login")}
        >
          Portal de Parceiros
          <br />
          <span className="text-sm font-normal">Programa de Parceria</span>
        </Button>
      </div>
    </div>
  );
};

export default Index;

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ResellerClientNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/reseller/clients')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Cliente</h1>
          <p className="text-gray-600 mt-1">
            Adicione um novo cliente à sua carteira
          </p>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
          <CardDescription>
            Preencha os dados do novo cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Funcionalidade em Desenvolvimento
            </h3>
            <p className="text-gray-600 mb-4">
              O formulário de criação de clientes será implementado em breve
            </p>
            <Button
              onClick={() => navigate('/reseller/clients')}
              variant="outline"
            >
              Voltar para Lista
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
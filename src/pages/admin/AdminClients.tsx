import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export function AdminClients() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Clientes</h1>
        <p className="text-gray-600 mt-1">
          Visualize e gerencie todos os clientes do sistema
        </p>
      </div>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Clientes</CardTitle>
          <CardDescription>
            Lista completa de clientes cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nenhum cliente cadastrado
            </h3>
            <p className="text-gray-600">
              Os clientes aparecerão aqui conforme forem adicionados pelos revendedores
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
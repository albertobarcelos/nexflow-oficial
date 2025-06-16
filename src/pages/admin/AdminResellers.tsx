import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export function AdminResellers() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Revendedores</h1>
        <p className="text-gray-600 mt-1">
          Visualize e gerencie todos os revendedores do sistema
        </p>
      </div>

      {/* Lista de Revendedores */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Revendedores</CardTitle>
          <CardDescription>
            Lista completa de revendedores cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Funcionalidade em Desenvolvimento
            </h3>
            <p className="text-gray-600">
              A gestão de revendedores será implementada em breve
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
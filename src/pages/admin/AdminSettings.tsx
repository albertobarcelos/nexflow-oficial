import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export function AdminSettings() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
        <p className="text-gray-600 mt-1">
          Gerencie configurações globais do sistema
        </p>
      </div>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>
            Configurações globais do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Funcionalidade em Desenvolvimento
            </h3>
            <p className="text-gray-600">
              As configurações do sistema serão implementadas em breve
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
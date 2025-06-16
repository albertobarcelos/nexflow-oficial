import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Building2, Mail, Phone } from "lucide-react";

export function ResellerProfile() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600 mt-1">
          Visualize e edite suas informações pessoais
        </p>
      </div>

      {/* Informações do Perfil */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Seus dados pessoais e de contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600">
                Informações do perfil em desenvolvimento
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Informações da Empresa
            </CardTitle>
            <CardDescription>
              Dados da sua empresa revendedora
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600">
                Informações da empresa em desenvolvimento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
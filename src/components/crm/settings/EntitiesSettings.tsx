import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Plus, Settings, Table } from "lucide-react";

export function EntitiesSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Configurações de Entidades
          </CardTitle>
          <CardDescription>
            Configure as entidades do sistema e seus relacionamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  Empresas
                </CardTitle>
                <CardDescription>
                  Configurar campos e relacionamentos de empresas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  Pessoas
                </CardTitle>
                <CardDescription>
                  Configurar campos e relacionamentos de pessoas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  Oportunidades
                </CardTitle>
                <CardDescription>
                  Configurar campos e relacionamentos de oportunidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Entidade
                </CardTitle>
                <CardDescription>
                  Criar uma nova entidade personalizada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
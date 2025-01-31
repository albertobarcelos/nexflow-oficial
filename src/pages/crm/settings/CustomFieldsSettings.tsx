import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CustomFieldsSettings() {
  const [selectedEntityType, setSelectedEntityType] = useState<string>("companies");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Campos Personalizados</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie os campos personalizados para cada tipo de entidade
        </p>
      </div>

      <Tabs value={selectedEntityType} onValueChange={setSelectedEntityType}>
        <TabsList>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
          <TabsTrigger value="people">Pessoas</TabsTrigger>
          <TabsTrigger value="partners">Parceiros</TabsTrigger>
        </TabsList>

        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Campos de Empresas</CardTitle>
              <CardDescription>
                Configure os campos personalizados para empresas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Conteúdo dos campos de empresas */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="people">
          <Card>
            <CardHeader>
              <CardTitle>Campos de Pessoas</CardTitle>
              <CardDescription>
                Configure os campos personalizados para pessoas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Conteúdo dos campos de pessoas */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners">
          <Card>
            <CardHeader>
              <CardTitle>Campos de Parceiros</CardTitle>
              <CardDescription>
                Configure os campos personalizados para parceiros
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Conteúdo dos campos de parceiros */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 

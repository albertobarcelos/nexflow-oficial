import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomFieldsLayout } from "./custom-fields/CustomFieldsLayout";
import { EntitiesSettings } from "./entities/EntitiesSettings";

export function CustomFieldsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Personalização de Campos</h1>
        <p className="text-muted-foreground">
          Personalize os campos e entidades do seu CRM de acordo com suas necessidades
        </p>
      </div>

      <Tabs defaultValue="fields" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fields">Campos Personalizados</TabsTrigger>
          <TabsTrigger value="entities">Entidades Personalizadas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fields">
          <CustomFieldsLayout />
        </TabsContent>
        
        <TabsContent value="entities">
          <EntitiesSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
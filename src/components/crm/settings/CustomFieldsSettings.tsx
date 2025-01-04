import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomFieldsLayout } from "./custom-fields/CustomFieldsLayout";
import { EntitiesSettings } from "./entities/EntitiesSettings";

export function CustomFieldsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Personalização</h1>
        <p className="text-muted-foreground">
          Personalize as entidades e campos do seu CRM de acordo com suas necessidades
        </p>
      </div>

      <Tabs defaultValue="entities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entities">Entidades</TabsTrigger>
          <TabsTrigger value="fields">Campos Personalizados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="entities">
          <EntitiesSettings />
        </TabsContent>
        
        <TabsContent value="fields">
          <CustomFieldsLayout />
        </TabsContent>
      </Tabs>
    </div>
  );
}
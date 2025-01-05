import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { EntitiesCustomization } from "./customization/EntitiesCustomization";
import { PipelinesCustomization } from "./customization/PipelinesCustomization";

export function CustomizationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Personalização</h2>
        <p className="text-muted-foreground">
          Configure suas entidades e pipelines
        </p>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="entities" className="space-y-4">
          <TabsList>
            <TabsTrigger value="entities">Entidades</TabsTrigger>
            <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          </TabsList>
          
          <TabsContent value="entities" className="space-y-4">
            <EntitiesCustomization />
          </TabsContent>
          
          <TabsContent value="pipelines" className="space-y-4">
            <PipelinesCustomization />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
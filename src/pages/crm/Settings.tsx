import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutomationSettings } from "@/components/crm/settings/AutomationSettings";
import { TeamSettings } from "@/components/crm/settings/TeamSettings";
import { PipelineSettings } from "@/components/crm/settings/PipelineSettings";
import { CustomFieldsSettings } from "@/components/crm/settings/CustomFieldsSettings";
import { NotificationSettings } from "@/components/crm/settings/NotificationSettings";
import { EntityNamingSettings } from "@/components/crm/settings/EntityNamingSettings";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Personalize o CRM de acordo com suas necessidades
        </p>
      </div>

      <Tabs defaultValue="automations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="automations">Automações</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="fields">Campos Personalizados</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="naming">Nomenclatura</TabsTrigger>
        </TabsList>

        <TabsContent value="automations" className="space-y-4">
          <AutomationSettings />
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <TeamSettings />
        </TabsContent>

        <TabsContent value="pipelines" className="space-y-4">
          <PipelineSettings />
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <CustomFieldsSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="naming" className="space-y-4">
          <EntityNamingSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
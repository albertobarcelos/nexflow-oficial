import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutomationSettings } from "@/components/crm/settings/AutomationSettings";
import { TeamSettings } from "@/components/crm/settings/TeamSettings";
import { CustomizationSettings } from "@/components/crm/settings/CustomizationSettings";
import { NotificationSettings } from "@/components/crm/settings/NotificationSettings";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Personalize o CRM de acordo com suas necessidades
        </p>
      </div>

      <Tabs defaultValue="customization" className="space-y-4">
        <TabsList>
          <TabsTrigger value="automations">Automações</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="customization">Personalização</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="automations" className="space-y-4">
          <AutomationSettings />
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <TeamSettings />
        </TabsContent>

        <TabsContent value="customization" className="space-y-4">
          <CustomizationSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
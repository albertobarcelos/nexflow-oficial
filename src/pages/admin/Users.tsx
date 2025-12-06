import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTab } from "@/components/admin/users/UsersTab";
import { TeamsTab } from "@/components/admin/users/TeamsTab";
import { CompaniesTab } from "@/components/admin/users/CompaniesTab";

export default function Users() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Gestão de Organização</h1>
        <p className="text-gray-600 mt-1">
          Gerencie usuários, times e empresas do sistema
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="teams">Times</TabsTrigger>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <TeamsTab />
        </TabsContent>

        <TabsContent value="companies" className="mt-6">
          <CompaniesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

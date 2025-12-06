import { useState } from "react";
import { UsersTab } from "@/components/admin/users/UsersTab";
import { TeamsTab } from "@/components/admin/users/TeamsTab";
import { CompaniesTab } from "@/components/admin/users/CompaniesTab";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UsersRound, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Management() {
  const [activeTab, setActiveTab] = useState<"users" | "teams" | "companies">("users");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Gestão de Organização</h1>
        <p className="text-gray-600 mt-1">
          Gerencie usuários, times e empresas do sistema
        </p>
      </div>

      {/* Botões de Navegação */}
      <div className="flex gap-2 border-b border-gray-200">
        <Button
          variant="ghost"
          onClick={() => setActiveTab("users")}
          className={cn(
            "rounded-none border-b-2 border-transparent px-4 py-2 font-medium transition-colors",
            activeTab === "users"
              ? "border-nex-orange text-nex-orange bg-orange-50"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          )}
        >
          <Users className="mr-2 h-4 w-4" />
          Usuários
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("teams")}
          className={cn(
            "rounded-none border-b-2 border-transparent px-4 py-2 font-medium transition-colors",
            activeTab === "teams"
              ? "border-nex-orange text-nex-orange bg-orange-50"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          )}
        >
          <UsersRound className="mr-2 h-4 w-4" />
          Times
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("companies")}
          className={cn(
            "rounded-none border-b-2 border-transparent px-4 py-2 font-medium transition-colors",
            activeTab === "companies"
              ? "border-nex-orange text-nex-orange bg-orange-50"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          )}
        >
          <Building2 className="mr-2 h-4 w-4" />
          Empresas
        </Button>
      </div>

      {/* Conteúdo das Tabs */}
      <Card className="shadow-md">
        <CardContent className="pt-6">
          {activeTab === "users" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Usuários</h2>
                <p className="text-sm text-gray-600 mt-1">Gerencie os usuários do sistema</p>
              </div>
              <UsersTab />
            </div>
          )}

          {activeTab === "teams" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Times</h2>
                <p className="text-sm text-gray-600 mt-1">Gerencie os times da organização</p>
              </div>
              <TeamsTab />
            </div>
          )}

          {activeTab === "companies" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Empresas</h2>
                <p className="text-sm text-gray-600 mt-1">Gerencie as empresas cadastradas</p>
              </div>
              <CompaniesTab />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


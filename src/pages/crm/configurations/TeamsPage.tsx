import { CompanyTeamsManager } from "@/components/admin/users/CompanyTeamsManager";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function TeamsPage() {
  const { user } = useAuth();
  
  // Buscar client_id do usuário
  const { data: userData } = useQuery({
    queryKey: ["user-client", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("core_client_users")
        .select("client_id, core_clients:client_id(id, name, company_name)")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Erro ao buscar client_id:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  const clientId = userData?.client_id;
  const companyName = (userData?.core_clients as any)?.company_name || 
                      (userData?.core_clients as any)?.name || 
                      "Empresa";

  if (!clientId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando informações da empresa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Times</h1>
        <p className="text-muted-foreground">
          Gerencie os times da sua empresa
        </p>
      </div>
      <CompanyTeamsManager clientId={clientId} companyName={companyName} />
    </div>
  );
}

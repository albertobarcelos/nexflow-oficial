import { FranchisesManager } from "@/components/admin/users/FranchisesManager";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function UnitsPage() {
  const { user } = useAuth();
  
  // Buscar client_id do usuário
  const { data: userData } = useQuery({
    queryKey: ["user-client", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("core_client_users")
        .select("client_id")
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
        <h1 className="text-2xl font-bold">Unidades</h1>
        <p className="text-muted-foreground">
          Gerencie as unidades/franquias da sua empresa
        </p>
      </div>
      <FranchisesManager clientId={clientId} />
    </div>
  );
}

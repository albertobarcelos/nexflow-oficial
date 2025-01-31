import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export async function getFirstFunnel() {
  const { data: collaborator } = await supabase
    .from("collaborators")
    .select("client_id")
    .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!collaborator) throw new Error("Collaborator not found");

  const { data: funnels } = await supabase
    .from("funnels")
    .select("*")
    .eq("client_id", collaborator.client_id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  return funnels;
}

export function useFunnels() {
  return useQuery({
    queryKey: ["funnels"],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error("Collaborator not found");

      const { data: funnels } = await supabase
        .from("funnels")
        .select("*")
        .eq("client_id", collaborator.client_id)
        .order("created_at", { ascending: true });

      return funnels;
    },
  });
} 
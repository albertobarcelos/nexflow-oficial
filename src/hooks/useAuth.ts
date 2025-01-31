import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca o usuário atual
    console.log("useAuth - Verificando sessão atual");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("useAuth - Sessão encontrada:", !!session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Inscreve para mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("useAuth - Mudança de estado de autenticação:", !!session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
  };
} 

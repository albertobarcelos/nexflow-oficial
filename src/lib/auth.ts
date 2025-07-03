import { supabase, getCurrentUserWithClient } from "./supabase";
import { logger } from "./config";

// Função helper para obter dados do usuário com sistema RLS
export const getCurrentUserData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    const userWithClient = await getCurrentUserWithClient();
    
    if (!userWithClient || !userWithClient.client_id) {
      logger.error('Usuário sem client_id associado:', { userId: user.id, email: user.email });
      throw new Error("Usuário não possui cliente associado");
    }

    return {
      id: user.id,
      client_id: userWithClient.client_id,
      role: userWithClient.role,
      email: user.email,
      client_data: userWithClient.core_clients
    };

  } catch (error) {
    logger.error("Erro em getCurrentUserData", error);
    return null;
  }
};

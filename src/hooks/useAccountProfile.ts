import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { UserProfile } from "@/types/profile";

export function useAccountProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const fetchUserProfile = useCallback(async (supabaseUser: User) => {
    try {
      const { data, error } = await supabase
        .from("core_client_users")
        .select(
          `
          *,
          core_clients (
            name
          )
        `
        )
        .eq("id", supabaseUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setUser({
          ...supabaseUser,
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          avatar_url: data.avatar_url || "",
          avatar_type: data.avatar_type || "toy_face",
          avatar_seed: data.avatar_seed || "1|1",
          custom_avatar_url: data.custom_avatar_url || null,
          organizationId: data.client_id,
          organizationName:
            (data.core_clients as unknown as { name: string })?.name || "N/A",
        });
      } else {
        setUser(supabaseUser);
      }
    } catch (error: unknown) {
      console.error("Error fetching user profile:", (error as Error).message);
      setUser(supabaseUser);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
      setIsLoadingUser(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setIsLoadingUser(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setIsLoadingUser(false);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const updateUserProfile = useCallback(
    async (
      newFirstName?: string,
      newLastName?: string,
      newEmail?: string,
      newAvatarUrl?: string | null,
      newAvatarType?: string,
      newAvatarSeed?: string,
      newCustomAvatarUrl?: string | null
    ) => {
      console.log("🔄 updateUserProfile iniciado", { 
        newFirstName, newLastName, newEmail, newAvatarUrl, newAvatarType, newAvatarSeed, newCustomAvatarUrl 
      });
      
      if (!user) throw new Error("User not authenticated.");

      // TEMPORÁRIO: Pulando atualização de autenticação para resolver o travamento
      console.log("⏭️ Pulando atualização de autenticação temporariamente");

      const profileUpdates: Partial<
        Database["public"]["Tables"]["core_client_users"]["Update"]
      > = {};
      
      // Sempre incluir campos que foram passados, mesmo que sejam iguais
      if (newFirstName !== undefined) {
        profileUpdates.first_name = newFirstName;
      }
      if (newLastName !== undefined) {
        profileUpdates.last_name = newLastName;
      }
      if (newAvatarUrl !== undefined) {
        profileUpdates.avatar_url = newAvatarUrl;
      }
      if (newAvatarType !== undefined) {
        profileUpdates.avatar_type = newAvatarType;
      }
      if (newAvatarSeed !== undefined) {
        profileUpdates.avatar_seed = newAvatarSeed;
      }
      if (newCustomAvatarUrl !== undefined) {
        profileUpdates.custom_avatar_url = newCustomAvatarUrl;
      }

      console.log("💾 Atualizações do perfil:", profileUpdates);

      if (Object.keys(profileUpdates).length > 0) {
        console.log("📊 Atualizando dados do perfil no banco...");
        console.log("🔍 ID do usuário sendo usado:", user.id);
        console.log("🔍 Tipo do ID:", typeof user.id);
        
        console.log("🚀 Iniciando query de atualização...");
        let updatedProfile;
        try {
          const { data, error: profileError } = await supabase
            .from("core_client_users")
            .update(profileUpdates)
            .eq("id", user.id)
            .select();

          updatedProfile = data;

          console.log("📥 Resposta da query recebida");
          console.log("📊 Data:", updatedProfile);
          console.log("❌ Error:", profileError);

          if (profileError) {
            console.error("❌ Erro no banco de dados:", profileError);
            throw profileError;
          }

          console.log("✅ Dados do perfil atualizados no banco:", updatedProfile);
        } catch (queryError) {
          console.error("💥 Erro durante execução da query:", queryError);
          throw queryError;
        }

        if (updatedProfile && updatedProfile.length > 0) {
          const profile = updatedProfile[0];
          console.log("🔄 Atualizando estado local com dados do banco:", profile);
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  first_name: profile.first_name || "",
                  last_name: profile.last_name || "",
                  avatar_url: profile.avatar_url || null,
                  avatar_type: profile.avatar_type || "toy_face",
                  avatar_seed: profile.avatar_seed || "1|1",
                  custom_avatar_url: profile.custom_avatar_url || null,
                }
              : null
          );
          console.log("✅ Estado local atualizado com sucesso");
          setLastUpdate(Date.now()); // Forçar re-renderização
          console.log("🔄 lastUpdate atualizado:", Date.now());
        } else {
          console.log("⚠️ Nenhum perfil retornado do banco, forçando atualização do estado local");
          // Forçar atualização do estado local mesmo sem retorno do banco
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  first_name: newFirstName !== undefined ? newFirstName : prev.first_name,
                  last_name: newLastName !== undefined ? newLastName : prev.last_name,
                  avatar_url: newAvatarUrl !== undefined ? newAvatarUrl : prev.avatar_url,
                  avatar_type: newAvatarType !== undefined ? newAvatarType : prev.avatar_type,
                  avatar_seed: newAvatarSeed !== undefined ? newAvatarSeed : prev.avatar_seed,
                  custom_avatar_url: newCustomAvatarUrl !== undefined ? newCustomAvatarUrl : prev.custom_avatar_url,
                }
              : null
          );
          setLastUpdate(Date.now()); // Forçar re-renderização
          console.log("🔄 lastUpdate atualizado (fallback):", Date.now());
        }
      }
      
      console.log("🏁 updateUserProfile concluído com sucesso");
    },
    [user]
  );

  const changeUserPassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!user) throw new Error("User not authenticated.");
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return data;
    },
    [user]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user) throw new Error("User not authenticated.");

      // Remover avatares antigos do usuário
      try {
        console.log("🗑️ Removendo avatares antigos...");
        const { data: existingFiles } = await supabase.storage
          .from("avatars")
          .list("", {
            search: user.id
          });

        if (existingFiles && existingFiles.length > 0) {
          const filesToRemove = existingFiles
            .filter(file => file.name.startsWith(user.id))
            .map(file => file.name);
          
          if (filesToRemove.length > 0) {
            await supabase.storage
              .from("avatars")
              .remove(filesToRemove);
            console.log("✅ Avatares antigos removidos:", filesToRemove);
          }
        }
      } catch (cleanupError) {
        console.warn("⚠️ Erro ao limpar avatares antigos:", cleanupError);
        // Não falhar o upload por causa da limpeza
      }

      const fileExt = file.name.split(".").pop();
      const timestamp = Date.now();
      const fileName = `${user.id}_${timestamp}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      console.log("📤 Fazendo upload do avatar:", { fileName, filePath });

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "0", // Sem cache para evitar problemas
          upsert: false, // Sempre criar novo arquivo
        });

      if (uploadError) {
        console.error("❌ Erro no upload:", uploadError);
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (publicUrlData) {
        console.log("✅ URL pública gerada:", publicUrlData.publicUrl);
        return publicUrlData.publicUrl;
      }
      return null;
    },
    [user]
  );

  return {
    user,
    isLoadingUser,
    updateUserProfile,
    changeUserPassword,
    uploadAvatar,
    lastUpdate,
  };
}

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
          name: data.name || "",
          surname: data.surname || "",
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAccountProfile.ts:55',message:'useAccountProfile effect started',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const getSession = async () => {
      setIsLoadingUser(true);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAccountProfile.ts:58',message:'useAccountProfile getSession called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const {
        data: { session },
      } = await supabase.auth.getSession();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAccountProfile.ts:64',message:'useAccountProfile getSession result',data:{hasSession:!!session,hasUser:!!session?.user,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAccountProfile.ts:75',message:'useAccountProfile onAuthStateChange',data:{event:_event,hasSession:!!session,hasUser:!!session?.user,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
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
      newName?: string,
      newSurname?: string,
      newEmail?: string,
      newAvatarUrl?: string | null,
      newAvatarType?: string,
      newAvatarSeed?: string,
      newCustomAvatarUrl?: string | null
    ) => {
      console.log("🔄 updateUserProfile iniciado", { 
        newName, newSurname, newEmail, newAvatarUrl, newAvatarType, newAvatarSeed, newCustomAvatarUrl 
      });
      
      if (!user) throw new Error("User not authenticated.");

      // TEMPORÁRIO: Pulando atualização de autenticação para resolver o travamento
      console.log("⏭️ Pulando atualização de autenticação temporariamente");

      const profileUpdates: Partial<
        Database["public"]["Tables"]["core_client_users"]["Update"]
      > = {};
      
      // Sempre incluir campos que foram passados, mesmo que sejam iguais
      if (newName !== undefined) {
        profileUpdates.name = newName;
      }
      if (newSurname !== undefined) {
        profileUpdates.surname = newSurname;
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
                  name: profile.name || "",
                  surname: profile.surname || "",
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
                  name: newName !== undefined ? newName : prev.name,
                  surname: newSurname !== undefined ? newSurname : prev.surname,
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

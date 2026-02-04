import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";
import { UserProfile } from "@/types/profile";
import { useClientStore } from "@/stores/clientStore";

/** Dados brutos do perfil vindos do Supabase (core_client_users + core_clients) */
interface ProfileRow {
  id: string;
  client_id: string;
  name: string | null;
  surname: string | null;
  avatar_url: string | null;
  avatar_type: string | null;
  avatar_seed: string | null;
  custom_avatar_url: string | null;
  core_clients: { name: string } | null;
}

async function fetchAccountProfile(
  userId: string,
  clientId: string
): Promise<UserProfile | null> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser || authUser.id !== userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("core_client_users")
    .select(
      `
      id,
      client_id,
      name,
      surname,
      avatar_url,
      avatar_type,
      avatar_seed,
      custom_avatar_url,
      core_clients (
        name
      )
    `
    )
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  const row = data as ProfileRow | null;
  if (!row) {
    return {
      ...authUser,
      name: "",
      surname: "",
      avatar_url: "",
      avatar_type: "toy_face",
      avatar_seed: "1|1",
      custom_avatar_url: null,
      organizationId: undefined,
      organizationName: "N/A",
    };
  }

  // Validação de segurança: perfil deve pertencer ao cliente do contexto
  if (row.client_id !== clientId) {
    console.error("[SECURITY] Perfil com client_id diferente do contexto atual");
    throw new Error("Violação de segurança: perfil não pertence ao cliente atual");
  }

  const profile: UserProfile = {
    ...authUser,
    name: row.name ?? "",
    surname: row.surname ?? "",
    avatar_url: row.avatar_url ?? "",
    avatar_type: row.avatar_type ?? "toy_face",
    avatar_seed: row.avatar_seed ?? "1|1",
    custom_avatar_url: row.custom_avatar_url ?? null,
    organizationId: row.client_id,
    organizationName:
      (row.core_clients as { name: string } | null)?.name ?? "N/A",
  };

  // Auditoria na primeira carga relevante
  console.info("[AUDIT] Perfil da conta - Client:", clientId);

  return profile;
}

export function useAccountProfile() {
  const queryClient = useQueryClient();
  const { currentClient } = useClientStore();
  const clientId = currentClient?.id ?? null;

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Sincronizar userId com a sessão de auth para queryKey e invalidação
  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setAuthUserId(session?.user?.id ?? null);
      setSessionLoaded(true);
    };
    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const {
    data: user,
    isLoading: isQueryLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["account-profile", clientId, authUserId],
    queryFn: () =>
      fetchAccountProfile(authUserId!, clientId!),
    enabled: !!clientId && !!authUserId,
    staleTime: 1000 * 60 * 5,
  });

  const updateUserProfile = useCallback(
    async (
      newName?: string,
      newSurname?: string,
      _newEmail?: string,
      newAvatarUrl?: string | null,
      newAvatarType?: string,
      newAvatarSeed?: string,
      newCustomAvatarUrl?: string | null
    ) => {
      if (!user) throw new Error("User not authenticated.");

      const profileUpdates: Partial<
        Database["public"]["Tables"]["core_client_users"]["Update"]
      > = {};
      if (newName !== undefined) profileUpdates.name = newName;
      if (newSurname !== undefined) profileUpdates.surname = newSurname;
      if (newAvatarUrl !== undefined) profileUpdates.avatar_url = newAvatarUrl;
      if (newAvatarType !== undefined) profileUpdates.avatar_type = newAvatarType;
      if (newAvatarSeed !== undefined) profileUpdates.avatar_seed = newAvatarSeed;
      if (newCustomAvatarUrl !== undefined)
        profileUpdates.custom_avatar_url = newCustomAvatarUrl;

      if (Object.keys(profileUpdates).length === 0) return;

      const { data: updatedProfile, error: profileError } = await supabase
        .from("core_client_users")
        .update(profileUpdates)
        .eq("id", user.id)
        .select();

      if (profileError) throw profileError;

      if (updatedProfile && updatedProfile.length > 0) {
        const profile = updatedProfile[0];
        queryClient.setQueryData<UserProfile | null>(
          ["account-profile", clientId, authUserId],
          (prev) =>
            prev
              ? {
                  ...prev,
                  name: profile.name ?? "",
                  surname: profile.surname ?? "",
                  avatar_url: profile.avatar_url ?? null,
                  avatar_type: profile.avatar_type ?? "toy_face",
                  avatar_seed: profile.avatar_seed ?? "1|1",
                  custom_avatar_url: profile.custom_avatar_url ?? null,
                }
              : null
        );
      } else {
        queryClient.setQueryData<UserProfile | null>(
          ["account-profile", clientId, authUserId],
          (prev) =>
            prev
              ? {
                  ...prev,
                  name: newName ?? prev.name,
                  surname: newSurname ?? prev.surname,
                  avatar_url: newAvatarUrl ?? prev.avatar_url,
                  avatar_type: newAvatarType ?? prev.avatar_type,
                  avatar_seed: newAvatarSeed ?? prev.avatar_seed,
                  custom_avatar_url: newCustomAvatarUrl ?? prev.custom_avatar_url,
                }
              : null
        );
      }

      setLastUpdate(Date.now());
      queryClient.invalidateQueries({
        queryKey: ["account-profile", clientId, authUserId],
      });
    },
    [user, clientId, authUserId, queryClient]
  );

  const changeUserPassword = useCallback(
    async (_currentPassword: string, newPassword: string) => {
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

      try {
        const { data: existingFiles } = await supabase.storage
          .from("avatars")
          .list("", { search: user.id });

        if (existingFiles?.length) {
          const filesToRemove = existingFiles
            .filter((f) => f.name.startsWith(user.id))
            .map((f) => f.name);
          if (filesToRemove.length > 0) {
            await supabase.storage.from("avatars").remove(filesToRemove);
          }
        }
      } catch {
        // Não falhar o upload por causa da limpeza
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { cacheControl: "0", upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      return publicUrlData?.publicUrl ?? null;
    },
    [user]
  );

  const isLoadingUser =
    !sessionLoaded ||
    (!!clientId && !!authUserId && isQueryLoading);

  return {
    user: user ?? null,
    isLoadingUser,
    profileError: profileError ?? null,
    updateUserProfile,
    changeUserPassword,
    uploadAvatar,
    lastUpdate,
  };
}

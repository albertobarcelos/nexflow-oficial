import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { UserProfile } from "@/types/profile";

export function useAccountProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

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
      newAvatarUrl?: string | null
    ) => {
      if (!user) throw new Error("User not authenticated.");

      const updates: {
        data?: { full_name?: string; avatar_url?: string | null };
        email?: string;
      } = {};

      let fullName = user.user_metadata?.full_name;
      if (newFirstName !== undefined && newLastName !== undefined) {
        fullName = `${newFirstName} ${newLastName}`.trim();
      } else if (newFirstName !== undefined) {
        fullName = `${newFirstName} ${
          user.user_metadata?.last_name || ""
        }`.trim();
      } else if (newLastName !== undefined) {
        fullName = `${
          user.user_metadata?.first_name || ""
        } ${newLastName}`.trim();
      }

      if (fullName !== user.user_metadata?.full_name) {
        updates.data = { ...updates.data, full_name: fullName };
      }
      if (newEmail !== undefined && newEmail !== user.email) {
        updates.email = newEmail;
      }
      if (
        newAvatarUrl !== undefined &&
        newAvatarUrl !== user.user_metadata?.avatar_url
      ) {
        updates.data = { ...updates.data, avatar_url: newAvatarUrl };
      }

      if (Object.keys(updates).length > 0) {
        const { data: updatedAuthUser, error: authError } =
          await supabase.auth.updateUser(updates);
        if (authError) throw authError;
        setUser((prev) =>
          prev
            ? {
                ...prev,
                ...updatedAuthUser.user,
                user_metadata: updatedAuthUser.user.user_metadata,
              }
            : null
        );
      }

      const profileUpdates: Partial<
        Database["public"]["Tables"]["core_client_users"]["Update"]
      > = {};
      if (newFirstName !== undefined && newFirstName !== user.first_name) {
        profileUpdates.first_name = newFirstName;
      }
      if (newLastName !== undefined && newLastName !== user.last_name) {
        profileUpdates.last_name = newLastName;
      }
      if (newAvatarUrl !== undefined && newAvatarUrl !== user.avatar_url) {
        profileUpdates.avatar_url = newAvatarUrl;
      }

      if (Object.keys(profileUpdates).length > 0) {
        const { data: updatedProfile, error: profileError } = await supabase
          .from("core_client_users")
          .update(profileUpdates)
          .eq("id", user.id)
          .select()
          .single();

        if (profileError) throw profileError;

        if (updatedProfile) {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  first_name: updatedProfile.first_name || "",
                  last_name: updatedProfile.last_name || "",
                  avatar_url: updatedProfile.avatar_url || "",
                }
              : null
          );
        }
      }
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

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (publicUrlData) {
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
  };
}

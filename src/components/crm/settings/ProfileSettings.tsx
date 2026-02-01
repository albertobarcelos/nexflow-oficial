import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfileForm } from "@/components/crm/account/UserProfileForm";
import { PasswordChangeForm } from "@/components/crm/account/PasswordChangeForm";
import { useAccountProfile } from "@/hooks/useAccountProfile";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function ProfileSettings() {
  const { user, isLoadingUser, updateUserProfile, changeUserPassword, uploadAvatar } = useAccountProfile();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleProfileSave = async (data: { 
    name?: string; 
    surname?: string; 
    email?: string; 
    avatar_file?: File | null;
    avatar_seed?: string | null;
    avatar_type?: string;
    custom_avatar_url?: string | null;
  }) => {
    setIsSaving(true);
    try {
      let finalAvatarUrl = user?.avatar_url;
      let finalCustomAvatarUrl = data.custom_avatar_url;

      if (data.avatar_file) {
        const uploadedUrl = await uploadAvatar(data.avatar_file);
        finalAvatarUrl = uploadedUrl;
        finalCustomAvatarUrl = uploadedUrl;
      } else if (data.avatar_type === "toy_face") {
        finalAvatarUrl = null;
        finalCustomAvatarUrl = null;
      } else if (data.avatar_type === "custom" && !data.avatar_file) {
        finalAvatarUrl = user?.custom_avatar_url;
        finalCustomAvatarUrl = user?.custom_avatar_url;
      }

      await updateUserProfile(
        data.name,
        data.surname,
        data.email,
        finalAvatarUrl,
        data.avatar_type,
        data.avatar_seed || undefined,
        finalCustomAvatarUrl
      );

      toast({
        title: "Sucesso!",
        description: "Seu perfil foi atualizado.",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: `Falha ao atualizar o perfil: ${(error as Error).message || "Tente novamente."}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (data: { newPassword?: string }) => {
    setIsChangingPassword(true);
    try {
      await changeUserPassword("", data.newPassword || "");
      toast({
        title: "Sucesso!",
        description: "Sua senha foi alterada.",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: `Falha ao alterar a senha: ${(error as Error).message || "Tente novamente."}`,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Usuário não encontrado ou não autenticado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Perfil</h2>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e senha
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>
            Atualize seu nome, email e avatar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserProfileForm
            user={user}
            onSave={handleProfileSave}
            isLoading={isSaving}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>
            Altere sua senha de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm
            onChangePassword={handlePasswordChange}
            isLoading={isChangingPassword}
          />
        </CardContent>
      </Card>
    </div>
  );
}






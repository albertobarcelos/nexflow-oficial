import { useState } from "react";
import { UserProfileForm } from "@/components/crm/account/UserProfileForm";
import { PasswordChangeForm } from "@/components/crm/account/PasswordChangeForm";
import { useAccountProfile } from "@/hooks/useAccountProfile";
import { useToast } from "@/hooks/use-toast";
import { ProfileSidebar } from "@/components/crm/account/ProfileSidebar";
import { ClientInfoForm } from "@/components/crm/account/ClientInfoForm";

export default function AccountProfilePage() {
    const { user, isLoadingUser, updateUserProfile, changeUserPassword, uploadAvatar } = useAccountProfile();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const handleProfileSave = async (data: { first_name?: string; last_name?: string; email?: string; avatar_file?: File | null }) => {
        setIsSaving(true);
        let avatarUrl: string | null = user?.avatar_url || null;

        try {
            if (data.avatar_file) {
                avatarUrl = await uploadAvatar(data.avatar_file);
            } else if (user?.avatar_url && !data.avatar_file) {
                avatarUrl = user.avatar_url;
            }
            await updateUserProfile(data.first_name, data.last_name, data.email, avatarUrl);
            toast({
                title: "Sucesso!",
                description: "Seu perfil foi atualizado.",
            });
            setIsEditing(false);
        } catch (error: unknown) {
            toast({
                title: "Erro",
                description: `Falha ao atualizar o perfil: ${(error as Error).message || "Tente novamente."}`,
                variant: "destructive",
            });
            console.error("Profile update error:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async (data: { currentPassword?: string; newPassword?: string }) => {
        setIsChangingPassword(true);
        try {
            await changeUserPassword(data.currentPassword || "", data.newPassword || "");
            toast({
                title: "Sucesso!",
                description: "Sua senha foi alterada.",
            });
        } catch (error: unknown) {
            toast({
                title: "Erro",
                description: `Falha ao alterar a senha: ${(error as Error).message || "Verifique sua senha atual e tente novamente."}`,
                variant: "destructive",
            });
            console.error("Password change error:", error);
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleNavigate = (sectionId: string) => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (isLoadingUser) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Carregando perfil...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Usuário não encontrado ou não autenticado.</p>
            </div>
        );
    }

    return (
        <div className="">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="w-[300px] h-full sm:w-full flex flex-col overflow-hidden bg-muted ">
                    <section className="fixed dark:bg-muted shadow-sm p-6 m-0 h-full flex flex-col justify-between">
                        <ProfileSidebar onNavigate={handleNavigate} />
                    </section>
                </div>

                <div className="col-span-2 space-y-6 overflow-y-auto pr-3">
                    <div className="mb-6 mt-16" id="user-data-section"></div>
                    <section className="bg-white dark:bg-muted rounded-xl shadow-sm p-6">
                        <UserProfileForm user={user} onSave={handleProfileSave} isLoading={isSaving} isEditing={isEditing} onToggleEdit={() => setIsEditing(prev => !prev)} />
                    </section>

                    <div className="mb-6 pt-4" id="change-password-section">
                    </div>
                    <section className="bg-white dark:bg-muted rounded-xl shadow-sm p-6">
                        <PasswordChangeForm onChangePassword={handlePasswordChange} isLoading={isChangingPassword} />
                    </section>

                    <div className="mb-6 pt-4" id="team-info-section">
                    </div>
                    <section className="bg-white dark:bg-muted rounded-xl shadow-sm p-6">
                        <ClientInfoForm user={user} />
                    </section>
                </div>
            </div>
        </div>
    );
}

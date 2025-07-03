import { useState } from "react";
import { UserProfileForm } from "@/components/crm/account/UserProfileForm";
import { PasswordChangeForm } from "@/components/crm/account/PasswordChangeForm";
import { useAccountProfile } from "@/hooks/useAccountProfile";
import { useToast } from "@/hooks/use-toast";
import { ProfileSidebar } from "@/components/crm/account/ProfileSidebar";
import { ClientInfoForm } from "@/components/crm/account/ClientInfoForm";
import { TeamInfoPanel } from "@/components/crm/account/TeamInfoPanel";
import ReactToyFace from "react-toy-face";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AccountProfilePage() {
    const { user, isLoadingUser, updateUserProfile, changeUserPassword, uploadAvatar } = useAccountProfile();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('user-data-section');

    // Itens do menu (usados no sidebar e no select)
    const menuItems = [
        { id: 'user-data-section', label: 'Meu Perfil' },
        { id: 'change-password-section', label: 'Opções de Segurança' },
        { id: 'team-info-section', label: 'Informações da Equipe' },
        { id: 'chat-section', label: 'Chat' },
        { id: 'preferences-section', label: 'Preferências' },
        { id: 'notifications-section', label: 'Notificações' },
    ];

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
        <div className="w-full min-h-screen bg-[#f7f8fa] flex flex-col md:flex-row justify-center mdjustify-start items-start  p-2 md:py-12">
            {/* Topbar para mobile/tablet */}
            <div className="md:hidden w-full  top-0 bg-white border-b mb-2 flex flex-col gap-2 px-2 py-3 shadow-sm rounded-lg">
                <div className="text-lg font-bold">Configurações</div>
                <Select value={activeTab} onValueChange={setActiveTab}>
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {menuItems.map(item => (
                            <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col md:flex-row gap-2 md:gap-8 w-full max-w-full md:max-w-6xl px-1 md:px-0">
                {/* Sidebar só em desktop */}
                <aside className="hidden md:block w-72 bg-white border rounded-2xl shadow p-8 h-fit mb-2 md:mb-0">
                    <ProfileSidebar onNavigate={setActiveTab} activeSection={activeTab} />
                </aside>
                {/* Main Content */}
                <main className="flex-1">
                    {activeTab === 'user-data-section' && (
                        <section className="relative bg-white rounded-2xl shadow-md border border-gray-100 p-3 md:p-10 mb-4 md:mb-10">
                            <div className="mb-4 md:mb-10">
                                <UserProfileForm
                                    user={user}
                                    onSave={handleProfileSave}
                                    isLoading={isSaving}
                                />
                            </div>
                        </section>
                    )}
                    {activeTab === 'change-password-section' && (
                        <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-3 md:p-10 mb-4 md:mb-10">
                            <PasswordChangeForm onChangePassword={handlePasswordChange} isLoading={isChangingPassword} />
                        </section>
                    )}
                    {activeTab === 'team-info-section' && (
                        <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-3 md:p-10 mb-4 md:mb-10">
                            <TeamInfoPanel />
                        </section>
                    )}
                    {activeTab === 'chat-section' && (
                        <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-3 md:p-10 mb-4 md:mb-10">
                            <h3 className="text-lg font-semibold mb-2">Chat</h3>
                            <p className="text-muted-foreground">Configurações de chat em breve.</p>
                        </section>
                    )}
                    {activeTab === 'preferences-section' && (
                        <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-3 md:p-10 mb-4 md:mb-10">
                            <h3 className="text-lg font-semibold mb-2">Preferências</h3>
                            <p className="text-muted-foreground">Configurações de preferências em breve.</p>
                        </section>
                    )}
                    {activeTab === 'notifications-section' && (
                        <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-3 md:p-10 mb-4 md:mb-10">
                            <h3 className="text-lg font-semibold mb-2">Notificações</h3>
                            <p className="text-muted-foreground">Configurações de notificações em breve.</p>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}

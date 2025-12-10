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

    // Classe utilitária para slide up/down + fade
    const tabTransition = "transition-all duration-300 ease-in-out animate-slide-fade";

    const handleProfileSave = async (data: { 
        name?: string; 
        surname?: string; 
        email?: string; 
        avatar_file?: File | null;
        avatar_seed?: string | null;
        avatar_type?: string;
        custom_avatar_url?: string | null;
    }) => {
        console.log("🔄 handleProfileSave iniciado", { data, isSaving });
        setIsSaving(true);
        try {
            console.log("📝 Processando dados do avatar...");
            let finalAvatarUrl = user?.avatar_url;
            let finalCustomAvatarUrl = data.custom_avatar_url;

            // Se tem arquivo para upload
            if (data.avatar_file) {
                console.log("📤 Fazendo upload do arquivo...");
                const uploadedUrl = await uploadAvatar(data.avatar_file);
                finalAvatarUrl = uploadedUrl;
                finalCustomAvatarUrl = uploadedUrl;
                console.log("✅ Upload concluído:", uploadedUrl);
            }
            // Se mudou para ToyFace
            else if (data.avatar_type === "toy_face") {
                console.log("🎭 Configurando ToyFace...");
                finalAvatarUrl = null;
                finalCustomAvatarUrl = null;
            }
            // Se manteve custom mas sem novo arquivo
            else if (data.avatar_type === "custom" && !data.avatar_file) {
                console.log("🖼️ Mantendo avatar customizado...");
                finalAvatarUrl = user?.custom_avatar_url;
                finalCustomAvatarUrl = user?.custom_avatar_url;
            }

            console.log("💾 Atualizando perfil no banco...", {
                name: data.name,
                surname: data.surname,
                email: data.email,
                finalAvatarUrl,
                avatar_type: data.avatar_type,
                avatar_seed: data.avatar_seed,
                finalCustomAvatarUrl
            });

            await updateUserProfile(
                data.name,
                data.surname,
                data.email,
                finalAvatarUrl,
                data.avatar_type,
                data.avatar_seed || undefined,
                finalCustomAvatarUrl
            );

            console.log("✅ Perfil atualizado com sucesso!");
            toast({
                title: "Sucesso!",
                description: "Seu perfil foi atualizado.",
            });
            setIsEditing(false);
        } catch (error: unknown) {
            console.error("❌ Erro ao atualizar perfil:", error);
            toast({
                title: "Erro",
                description: `Falha ao atualizar o perfil: ${(error as Error).message || "Tente novamente."}`,
                variant: "destructive",
            });
        } finally {
            console.log("🏁 handleProfileSave finalizado, setIsSaving(false)");
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
                        <section className={`relative bg-white rounded-2xl shadow-md border border-gray-100 p-3 md:p-10 mb-4 md:mb-10 ${tabTransition}`}>
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
                        <section className={`bg-white rounded-2xl shadow-md border border-gray-100 p-3 md:p-10 mb-4 md:mb-10 ${tabTransition}`}>
                            <PasswordChangeForm onChangePassword={handlePasswordChange} isLoading={isChangingPassword} />
                        </section>
                    )}
                    {activeTab === 'team-info-section' && (
                        <section className={`bg-white rounded-2xl shadow-md border border-gray-100 p-3 md:p-10 mb-4 md:mb-10 ${tabTransition}`}>
                            <TeamInfoPanel />
                        </section>
                    )}
                    {activeTab === 'chat-section' && (
                        <section className={`bg-white rounded-2xl shadow-md border border-gray-100 p-3 md:p-10 mb-4 md:mb-10 ${tabTransition}`}>
                            <h3 className="text-lg font-semibold mb-2">Chat</h3>
                            <p className="text-muted-foreground">Configurações de chat em breve.</p>
                        </section>
                    )}
                    {activeTab === 'preferences-section' && (
                        <section className={`bg-white rounded-2xl shadow-md border border-gray-100 p-3 md:p-10 mb-4 md:mb-10 ${tabTransition}`}>
                            <h3 className="text-lg font-semibold mb-2">Preferências</h3>
                            <p className="text-muted-foreground">Configurações de preferências em breve.</p>
                        </section>
                    )}
                    {activeTab === 'notifications-section' && (
                        <section className={`bg-white rounded-2xl shadow-md border border-gray-100 p-3 md:p-10 mb-4 md:mb-10 ${tabTransition}`}>
                            <h3 className="text-lg font-semibold mb-2">Notificações</h3>
                            <p className="text-muted-foreground">Configurações de notificações em breve.</p>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}

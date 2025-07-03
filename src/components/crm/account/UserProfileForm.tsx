import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserProfile } from "@/types/profile";

interface UserProfileFormProps {
    user: UserProfile;
    onSave: (data: { first_name?: string; last_name?: string; email?: string; avatar_file?: File | null }) => Promise<void>;
    isLoading: boolean;
    isEditing: boolean;
    onToggleEdit: () => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
    user,
    onSave,
    isLoading,
    isEditing,
    onToggleEdit,
}) => {
    const [firstName, setFirstName] = useState(user.first_name || "");
    const [lastName, setLastName] = useState(user.last_name || "");
    const [email, setEmail] = useState(user.email || "");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null);

    useEffect(() => {
        setFirstName(user.first_name || "");
        setLastName(user.last_name || "");
        setEmail(user.email || "");
        setAvatarPreview(user.avatar_url || null);
    }, [user]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave({ first_name: firstName, last_name: lastName, email, avatar_file: avatarFile });
    };

    return (
        <div> <div className="flex items-center justify-between gap-4">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Dados do usuário</h2>
                <p className="text-sm text-muted-foreground">
                    Gerencie seu perfil com segurança.
                </p>
            </div>
            <Button onClick={onToggleEdit}>
                {isEditing ? "Cancelar Edição" : "Editar Perfil"}
            </Button>
        </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Avatar className="w-24 h-24">
                        <AvatarImage src={avatarPreview || undefined} alt="User Avatar" />
                        <AvatarFallback>{firstName ? firstName.charAt(0) : "U"}</AvatarFallback>
                    </Avatar>
                    {isEditing && (
                        <label className="bg-primary text-white text-sm px-3 py-1 rounded-md cursor-pointer hover:bg-primary/90 transition">
                            Trocar foto
                            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                        </label>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="first-name">Nome</Label>
                        <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={!isEditing} />
                    </div>
                    <div>
                        <Label htmlFor="last-name">Sobrenome</Label>
                        <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={!isEditing} />
                    </div>
                </div>

                <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isEditing} />
                </div>

                {isEditing && (
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Salvando..." : "Salvar alterações"}
                    </Button>
                )}
            </form>
        </div>
    );
};

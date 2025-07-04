import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordChangeFormProps {
    onChangePassword: (data: { currentPassword?: string; newPassword?: string }) => Promise<void>;
    isLoading: boolean;
}

export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ onChangePassword, isLoading }) => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [submitted, setSubmitted] = useState(false);

    const checkValidity = () => {
        const newErrors: { [key: string]: string } = {};
        if (!currentPassword) {
            newErrors.currentPassword = "Senha atual é obrigatória.";
        }
        if (newPassword.length < 8) {
            newErrors.newPassword = "Nova senha deve ter no mínimo 8 caracteres.";
        }
        if (newPassword !== confirmNewPassword) {
            newErrors.confirmNewPassword = "As senhas não coincidem.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (checkValidity()) {
            await onChangePassword({ currentPassword, newPassword });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setErrors({});
            setSubmitted(false);
        }
    };

    return (
        <section className="bg-white dark:bg-muted rounded-2xl shadow-sm">
            <div className="mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Alterar Senha</h2>
                    <p className="text-sm text-muted-foreground">
                        Mantenha sua conta segura atualizando sua senha regularmente.
                    </p>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 p-3">
                <div>
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    {submitted && errors.currentPassword && <p className="text-sm text-red-500 mt-1">{errors.currentPassword}</p>}
                </div>
                <div>
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    {submitted && errors.newPassword && <p className="text-sm text-red-500 mt-1">{errors.newPassword}</p>}
                </div>
                <div>
                    <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
                    <Input
                        id="confirm-new-password"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    {submitted && errors.confirmNewPassword && (
                        <p className="text-sm text-red-500 mt-1">{errors.confirmNewPassword}</p>
                    )}
                </div>
                <Button type="submit" disabled={isLoading} className="w-full mt-4">
                    {isLoading ? "Salvando..." : "Salvar Senha"}
                </Button>
            </form>
        </section>
    );
}; 
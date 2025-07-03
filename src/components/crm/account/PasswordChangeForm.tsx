import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PasswordChangeFormProps {
    onChangePassword: (data: { currentPassword?: string; newPassword?: string }) => Promise<void>;
    isLoading: boolean;
}

export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ onChangePassword, isLoading }) => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isFormValid, setIsFormValid] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);

    const checkValidity = () => {
        const newErrors: { [key: string]: string } = {};
        if (isEditingPassword && !currentPassword) {
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

    useEffect(() => {
        if (isEditingPassword) {
            setIsFormValid(checkValidity());
        } else {
            setIsFormValid(false);
            setErrors({});
            setSubmitted(false);
        }
    }, [currentPassword, newPassword, confirmNewPassword, isEditingPassword]);

    const handleToggleEditPassword = () => {
        if (isEditingPassword) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setErrors({});
            setIsFormValid(false);
            setSubmitted(false);
        }
        setIsEditingPassword(prev => !prev);
    };

    const handleConfirmChangePassword = async () => {
        setSubmitted(true);
        if (checkValidity()) {
            await onChangePassword({ currentPassword, newPassword });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setErrors({});
            setIsEditingPassword(false);
            setSubmitted(false);
        }
    };

    return (
        <section className="bg-white dark:bg-muted rounded-2xl shadow-sm">
            <div className="mb-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Alterar Senha</h2>
                        <p className="text-sm text-muted-foreground">
                            Mantenha sua conta segura atualizando sua senha regularmente.
                        </p>
                    </div>
                    <Button type="button" onClick={handleToggleEditPassword} disabled={isLoading}>
                        {isEditingPassword ? "Cancelar" : "Alterar Senha"}
                    </Button>
                </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-5 p-3">
                <div>
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={!isEditingPassword || isLoading}
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
                        disabled={!isEditingPassword || isLoading}
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
                        disabled={!isEditingPassword || isLoading}
                    />
                    {submitted && errors.confirmNewPassword && (
                        <p className="text-sm text-red-500 mt-1">{errors.confirmNewPassword}</p>
                    )}
                </div>

                {isEditingPassword && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" onClick={() => setSubmitted(true)} disabled={isLoading || !isFormValid}>
                                {isLoading ? "Salvando..." : "Salvar Senha"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação irá alterar sua senha. Certifique-se de que as novas senhas correspondem.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={handleToggleEditPassword}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleConfirmChangePassword} disabled={isLoading}>
                                    {isLoading ? "Salvando..." : "Confirmar Alteração"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </form>
        </section>
    );
}; 
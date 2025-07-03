import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserProfile } from "@/types/profile";

interface ClientInfoFormProps {
    user: UserProfile;
}

export const ClientInfoForm: React.FC<ClientInfoFormProps> = ({ user }) => {
    return (
        <section className="bg-white p-6 dark:bg-muted rounded-2xl shadow-sm">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Informações da Equipe</h2>
                <p className="text-sm text-muted-foreground">
                    Visualize os detalhes da sua organização.
                </p>
            </div>
            <div className="space-y-4 p-3">
                <div>
                    <Label>ID do Cliente/Licença</Label>
                    <Input value={user.organizationId || "N/A"} disabled />
                </div>
                <div>
                    <Label>Organização</Label>
                    <Input value={user.organizationName || "N/A"} disabled />
                </div>
                <div>
                    <Label>Data de Criação da Conta</Label>
                    <Input value={new Date(user.created_at || "").toLocaleDateString()} disabled />
                </div>
            </div>
        </section>
    );
}; 
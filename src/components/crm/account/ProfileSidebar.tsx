import React from 'react';
import { Button } from "@/components/ui/button";

interface ProfileSidebarProps {
    onNavigate: (sectionId: string) => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ onNavigate }) => {
    return (
        <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Configurações da Conta</h1>
                </div>

            </div>
            <Button variant="ghost" className="justify-start" onClick={() => onNavigate('user-data-section')}>
                Dados do Usuário
            </Button>
            <Button variant="ghost" className="justify-start" onClick={() => onNavigate('change-password-section')}>
                Alterar Senha
            </Button>
            <Button variant="ghost" className="justify-start" onClick={() => onNavigate('team-info-section')}>
                Informações da Equipe
            </Button>
        </div>
    );
};

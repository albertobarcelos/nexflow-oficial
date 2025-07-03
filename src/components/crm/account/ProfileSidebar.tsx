import React from 'react';
import { Button } from "@/components/ui/button";
import { User, Lock, MessageCircle, Settings, Bell, Users } from "lucide-react";

interface ProfileSidebarProps {
    onNavigate: (sectionId: string) => void;
    activeSection: string;
}

const items = [
    {
        id: 'user-data-section',
        label: 'Meu Perfil',
        icon: <User className="mr-2" />,
    },
    {
        id: 'change-password-section',
        label: 'Opções de Segurança',
        icon: <Lock className="mr-2" />,
    },
    {
        id: 'team-info-section',
        label: 'Informações da Equipe',
        icon: <Users className="mr-2" />,
    },
    {
        id: 'chat-section',
        label: 'Chat',
        icon: <MessageCircle className="mr-2" />,
    },
    {
        id: 'preferences-section',
        label: 'Preferências',
        icon: <Settings className="mr-2" />,
    },
    {
        id: 'notifications-section',
        label: 'Notificações',
        icon: <Bell className="mr-2" />,
    },
];

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ onNavigate, activeSection }) => {
    return (
        <div className="flex flex-col space-y-2">
            <div className="mb-6">
                <h1 className="text-lg font-bold text-foreground">Configurações</h1>
                <p className="text-muted-foreground text-sm">Encontre todas as configurações aqui.</p>
            </div>
            {items.map((item) => (
                <Button
                    key={item.id}
                    variant="ghost"
                    className={`w-full justify-start px-4 py-2 rounded-lg font-medium text-base transition-all flex items-center gap-2
                        ${activeSection === item.id ? "bg-blue-100 text-blue-600 shadow-none border border-blue-200" : "text-muted-foreground hover:bg-accent"}
                        ${activeSection === item.id ? "[&_svg]:text-blue-600" : "[&_svg]:text-muted-foreground"}
                    `}
                    onClick={() => onNavigate(item.id)}
                >
                    {item.icon}
                    {item.label}
                </Button>
            ))}
        </div>
    );
};

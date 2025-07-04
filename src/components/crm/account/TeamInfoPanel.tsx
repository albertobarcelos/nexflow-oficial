import React from "react";

export const TeamInfoPanel: React.FC = () => {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Informações da Equipe</h2>
            <p className="text-muted-foreground mb-6">Veja e gerencie os membros da sua equipe aqui.</p>
            <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-muted-foreground">
                (Em breve: painel de membros da equipe, permissões, convites, etc.)
            </div>
        </div>
    );
}; 
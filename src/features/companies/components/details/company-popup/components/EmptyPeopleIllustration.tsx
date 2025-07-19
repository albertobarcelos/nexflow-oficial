// AIDEV-NOTE: Componente de ilustração para quando não há pessoas vinculadas à empresa

import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyPeopleIllustrationProps {
  onAddPerson?: () => void;
}

/**
 * Componente que exibe uma ilustração quando não há pessoas vinculadas
 */
export const EmptyPeopleIllustration = ({ onAddPerson }: EmptyPeopleIllustrationProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Ilustração SVG */}
      <div className="mb-6">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-muted-foreground/30"
        >
          {/* Círculo de fundo */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="currentColor"
            fillOpacity="0.1"
          />
          
          {/* Ícone de pessoas */}
          <g transform="translate(30, 30)">
            {/* Pessoa 1 */}
            <circle cx="20" cy="20" r="8" fill="currentColor" fillOpacity="0.3" />
            <path
              d="M8 45c0-6.627 5.373-12 12-12s12 5.373 12 12v5H8v-5z"
              fill="currentColor"
              fillOpacity="0.3"
            />
            
            {/* Pessoa 2 */}
            <circle cx="40" cy="25" r="6" fill="currentColor" fillOpacity="0.2" />
            <path
              d="M30 45c0-5.523 4.477-10 10-10s10 4.477 10 10v5H30v-5z"
              fill="currentColor"
              fillOpacity="0.2"
            />
          </g>
          
          {/* Linha pontilhada decorativa */}
          <circle
            cx="60"
            cy="60"
            r="55"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 3"
            strokeOpacity="0.2"
          />
        </svg>
      </div>

      {/* Título */}
      <h3 className="text-lg font-semibold text-muted-foreground mb-2">
        Nenhuma pessoa vinculada
      </h3>

      {/* Descrição */}
      <p className="text-sm text-muted-foreground/80 mb-6 max-w-sm">
        Esta empresa ainda não possui pessoas vinculadas. Adicione contatos, funcionários ou responsáveis para começar.
      </p>

      {/* Botão de ação */}
      {onAddPerson && (
        <Button
          onClick={onAddPerson}
          variant="outline"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Pessoa
        </Button>
      )}

      {/* Dicas */}
      <div className="mt-8 text-xs text-muted-foreground/60 space-y-1">
        <p>💡 Dica: Você pode adicionar contatos, funcionários ou responsáveis</p>
        <p>📧 Mantenha os dados de contato sempre atualizados</p>
      </div>
    </div>
  );
};

export default EmptyPeopleIllustration;
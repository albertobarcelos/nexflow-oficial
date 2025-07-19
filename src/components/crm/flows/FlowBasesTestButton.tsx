import React from 'react';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
// AIDEV-NOTE: FlowBasesConfigModal removido durante simplificação - sistema focado apenas em deals

interface FlowBasesTestButtonProps {
  flowId: string;
  flowName: string;
}

export function FlowBasesTestButton({ flowId, flowName }: FlowBasesTestButtonProps) {
  // AIDEV-NOTE: Sistema simplificado - botão desabilitado, foco apenas em deals
  return (
    <Button
      variant="outline"
      size="sm"
      disabled
      className="gap-2 opacity-50"
      title="Funcionalidade removida - sistema simplificado para deals"
    >
      <Database className="w-4 h-4" />
      Configurar Entidades (Desabilitado)
    </Button>
  );
}
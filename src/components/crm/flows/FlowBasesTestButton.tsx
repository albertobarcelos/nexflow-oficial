import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { FlowBasesConfigModal } from './FlowBasesConfigModal';

interface FlowBasesTestButtonProps {
  flowId: string;
  flowName: string;
}

export function FlowBasesTestButton({ flowId, flowName }: FlowBasesTestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Database className="w-4 h-4" />
        Configurar Entidades
      </Button>

      <FlowBasesConfigModal
        open={isOpen}
        onOpenChange={setIsOpen}
        flowId={flowId}
        flowName={flowName}
      />
    </>
  );
} 
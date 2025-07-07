import React, { useState } from 'react';
import { MoreHorizontal, Settings, FormInput, Database, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { EntityFormBuilderModal } from './EntityFormBuilderModal';

interface EntityConfigurationDropdownProps {
  entityId: string;
  entityName: string;
  variant?: 'default' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showLabel?: boolean;
}

export function EntityConfigurationDropdown({ 
  entityId, 
  entityName, 
  variant = 'ghost',
  size = 'sm',
  showLabel = false 
}: EntityConfigurationDropdownProps) {
  const [formBuilderOpen, setFormBuilderOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size}
            className="h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu de configuração</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem 
            onClick={() => setFormBuilderOpen(true)}
            className="cursor-pointer"
          >
            <FormInput className="mr-2 h-4 w-4" />
            Configurar Campos
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer">
            <Database className="mr-2 h-4 w-4" />
            Ver Registros
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Entidade
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de Configuração de Campos */}
      <EntityFormBuilderModal
        open={formBuilderOpen}
        onOpenChange={setFormBuilderOpen}
        entityId={entityId}
        entityName={entityName}
      />
    </>
  );
} 
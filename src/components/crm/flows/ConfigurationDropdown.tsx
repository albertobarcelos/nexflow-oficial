import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Settings, FormInput, Layers, Users, Mail, Zap, Eye, Copy, Share2, Archive, Trash2, MoreHorizontal } from 'lucide-react';
import { FormBuilderModal } from './FormBuilderModal';

interface ConfigurationDropdownProps {
  flowId: string;
  flowName: string;
  type?: 'flow' | 'entity';
}

export function ConfigurationDropdown({ flowId, flowName, type = 'flow' }: ConfigurationDropdownProps) {
  const [formBuilderOpen, setFormBuilderOpen] = useState(false);

  const handleFormBuilderClick = () => {
    setFormBuilderOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{flowName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                Configurações do pipeline
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleFormBuilderClick}>
              <FormInput className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Configurar Formulários</span>
                <span className="text-xs text-muted-foreground">
                  Formulário inicial e por fases
                </span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Configurações Gerais</span>
                <span className="text-xs text-muted-foreground">
                  Visão geral, campos e automações
                </span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Layers className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Etapas do Pipeline</span>
                <span className="text-xs text-muted-foreground">
                  Configurar fases e fluxo
                </span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Permissões</span>
                <span className="text-xs text-muted-foreground">
                  Gerenciar acessos
                </span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Zap className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Automações</span>
                <span className="text-xs text-muted-foreground">
                  Configurar regras automáticas
                </span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Relatórios</span>
                <span className="text-xs text-muted-foreground">
                  Métricas e dashboards
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              <span>Duplicar</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="mr-2 h-4 w-4" />
              <span>Compartilhar</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Archive className="mr-2 h-4 w-4" />
              <span>Arquivar</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Excluir</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de Construção de Formulários */}
      <FormBuilderModal
        open={formBuilderOpen}
        onOpenChange={setFormBuilderOpen}
        flowId={flowId}
        flowName={flowName}
      />
    </>
  );
} 
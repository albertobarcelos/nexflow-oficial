import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FlowConfigurationModal } from '@/components/crm/flows/FlowConfigurationModal';
import { EntityConfigurationModal } from '@/components/crm/entities/EntityConfigurationModal';
import { 
  Settings, 
  Zap, 
  FormInput, 
  Users, 
  BarChart, 
  Palette,
  Database,
  Link,
  Shield,
  Layout,
  Globe,
  ExternalLink,
  Copy,
  Archive,
  Trash2,
  ChevronDown
} from 'lucide-react';

interface ConfigurationDropdownProps {
  type: 'flow' | 'entity';
  itemId: string;
  itemName: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  showLabel?: boolean;
}

export function ConfigurationDropdown({ 
  type, 
  itemId, 
  itemName, 
  variant = 'ghost',
  size = 'sm',
  showLabel = true
}: ConfigurationDropdownProps) {
  const [showConfigModal, setShowConfigModal] = useState(false);

  const getMenuItems = () => {
    if (type === 'flow') {
      return [
        { 
          icon: Settings, 
          label: 'Configurações Gerais', 
          action: () => setShowConfigModal(true),
          description: 'Nome, descrição e configurações básicas'
        },
        { 
          icon: FormInput, 
          label: 'Campos Personalizados', 
          action: () => setShowConfigModal(true),
          description: 'Adicionar e editar campos do formulário'
        },
        { 
          icon: Zap, 
          label: 'Automações', 
          action: () => setShowConfigModal(true),
          description: 'Configurar automações inteligentes'
        },
        { 
          icon: Users, 
          label: 'Permissões', 
          action: () => setShowConfigModal(true),
          description: 'Controlar acesso e permissões'
        },
        { 
          icon: BarChart, 
          label: 'Relatórios', 
          action: () => setShowConfigModal(true),
          description: 'Configurar dashboards e métricas'
        },
        { 
          icon: Palette, 
          label: 'Personalização', 
          action: () => setShowConfigModal(true),
          description: 'Aparência e layout personalizado'
        }
      ];
    } else {
      return [
        { 
          icon: Database, 
          label: 'Estrutura e Campos', 
          action: () => setShowConfigModal(true),
          description: 'Gerenciar campos e tipos de dados'
        },
        { 
          icon: Link, 
          label: 'Relacionamentos', 
          action: () => setShowConfigModal(true),
          description: 'Conectar com outras bases'
        },
        { 
          icon: Layout, 
          label: 'Visualizações', 
          action: () => setShowConfigModal(true),
          description: 'Configurar views e layouts'
        },
        { 
          icon: Zap, 
          label: 'Automações', 
          action: () => setShowConfigModal(true),
          description: 'Automatizar processos da base'
        },
        { 
          icon: Shield, 
          label: 'Permissões', 
          action: () => setShowConfigModal(true),
          description: 'Controlar acesso aos dados'
        },
        { 
          icon: Settings, 
          label: 'API e Integrações', 
          action: () => setShowConfigModal(true),
          description: 'Configurar APIs e webhooks'
        }
      ];
    }
  };

  const getActions = () => {
    return [
      { 
        icon: Copy, 
        label: 'Duplicar', 
        action: () => console.log(`Duplicar ${type}:`, itemId),
        description: `Criar uma cópia deste ${type === 'flow' ? 'pipeline' : 'base'}`
      },
      { 
        icon: ExternalLink, 
        label: 'Compartilhar', 
        action: () => console.log(`Compartilhar ${type}:`, itemId),
        description: 'Gerar link de compartilhamento'
      },
      { 
        icon: Archive, 
        label: 'Arquivar', 
        action: () => console.log(`Arquivar ${type}:`, itemId),
        description: 'Mover para arquivos'
      },
      { 
        icon: Trash2, 
        label: 'Excluir', 
        action: () => console.log(`Excluir ${type}:`, itemId),
        description: 'Remover permanentemente',
        destructive: true
      }
    ];
  };

  const menuItems = getMenuItems();
  const actions = getActions();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className="gap-2">
            <Settings className="w-4 h-4" />
            {showLabel && 'Configurar'}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center gap-2">
            {type === 'flow' ? (
              <Settings className="w-4 h-4 text-blue-600" />
            ) : (
              <Database className="w-4 h-4 text-green-600" />
            )}
            {itemName}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Configurações */}
          <div className="px-2 py-1">
            <p className="text-xs font-medium text-gray-500 mb-1">CONFIGURAÇÕES</p>
          </div>
          {menuItems.map((item, index) => (
            <DropdownMenuItem 
              key={index} 
              onClick={item.action}
              className="flex flex-col items-start gap-1 p-3 cursor-pointer"
            >
              <div className="flex items-center gap-2 w-full">
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </div>
              <p className="text-xs text-gray-500 ml-6">{item.description}</p>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Ações */}
          <div className="px-2 py-1">
            <p className="text-xs font-medium text-gray-500 mb-1">AÇÕES</p>
          </div>
          {actions.map((action, index) => (
            <DropdownMenuItem 
              key={index} 
              onClick={action.action}
              className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                action.destructive ? 'text-red-600 focus:text-red-600' : ''
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <action.icon className="w-4 h-4" />
                <span className="font-medium">{action.label}</span>
              </div>
              <p className="text-xs text-gray-500 ml-6">{action.description}</p>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modais de Configuração */}
      {type === 'flow' ? (
        <FlowConfigurationModal
          open={showConfigModal}
          onOpenChange={setShowConfigModal}
          flowId={itemId}
          flowName={itemName}
        />
      ) : (
        <EntityConfigurationModal
          open={showConfigModal}
          onOpenChange={setShowConfigModal}
          entityId={itemId}
          entityName={itemName}
        />
      )}
    </>
  );
} 
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // =====================================================
  // FUNÇÕES DAS AÇÕES
  // =====================================================
  
  const handleDuplicate = async () => {
    setIsProcessing(true);
    try {
      if (type === 'flow') {
        // Buscar dados do flow original
        const { data: originalFlow, error: flowError } = await supabase
          .from('web_flows')
          .select('*')
          .eq('id', itemId)
          .single();

        if (flowError) throw flowError;

        // Criar novo flow
        const { data: newFlow, error: createError } = await supabase
          .from('web_flows')
          .insert({
            name: `${originalFlow.name} (Cópia)`,
            description: originalFlow.description,
            is_active: false, // Criar como inativo
            user_id: user?.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;

        // Duplicar stages
        const { data: originalStages, error: stagesError } = await supabase
          .from('web_flow_stages')
          .select('*')
          .eq('flow_id', itemId)
          .order('order_index');

        if (stagesError) throw stagesError;

        if (originalStages && originalStages.length > 0) {
          const newStages = originalStages.map(stage => ({
            flow_id: newFlow.id,
            name: stage.name,
            description: stage.description,
            color: stage.color,
            order_index: stage.order_index,
            stage_type: stage.stage_type,
            is_final_stage: stage.is_final_stage
          }));

          await supabase.from('web_flow_stages').insert(newStages);
        }

        toast.success('Flow duplicado com sucesso!');
      } else {
        // Duplicar entidade
        const { data: originalEntity, error: entityError } = await supabase
          .from('web_entities')
          .select('*')
          .eq('id', itemId)
          .single();

        if (entityError) throw entityError;

        const { data: newEntity, error: createError } = await supabase
          .from('web_entities')
          .insert({
            name: `${originalEntity.name} (Cópia)`,
            description: originalEntity.description,
            table_name: `${originalEntity.table_name}_copy`,
            is_active: false,
            user_id: user?.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;

        toast.success('Entidade duplicada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      toast.error('Erro ao duplicar item');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/shared/${type}/${itemId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link de compartilhamento copiado!');
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast.error('Erro ao gerar link de compartilhamento');
    }
  };

  const handleArchive = async () => {
    setIsProcessing(true);
    try {
      const tableName = type === 'flow' ? 'web_flows' : 'web_entities';
      
      const { error } = await supabase
        .from(tableName)
        .update({ 
          is_active: false,
          archived_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      toast.success(`${type === 'flow' ? 'Flow' : 'Entidade'} arquivado com sucesso!`);
      setShowArchiveDialog(false);
    } catch (error) {
      console.error('Erro ao arquivar:', error);
      toast.error('Erro ao arquivar item');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      if (type === 'flow') {
        // Deletar stages primeiro (relacionamento)
        await supabase
          .from('web_flow_stages')
          .delete()
          .eq('flow_id', itemId);

        // Deletar automações
        await supabase
          .from('web_flow_automations')
          .delete()
          .eq('source_flow_id', itemId);

        // Deletar flow
        const { error } = await supabase
          .from('web_flows')
          .delete()
          .eq('id', itemId);

        if (error) throw error;
      } else {
        // Deletar campos da entidade primeiro
        await supabase
          .from('web_entity_fields')
          .delete()
          .eq('entity_id', itemId);

        // Deletar relacionamentos
        await supabase
          .from('web_entity_relationships')
          .delete()
          .or(`source_entity_id.eq.${itemId},related_entity_id.eq.${itemId}`);

        // Deletar entidade
        const { error } = await supabase
          .from('web_entities')
          .delete()
          .eq('id', itemId);

        if (error) throw error;
      }

      toast.success(`${type === 'flow' ? 'Flow' : 'Entidade'} excluído com sucesso!`);
      setShowDeleteDialog(false);
      
      // Recarregar página para atualizar lista
      window.location.reload();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir item');
    } finally {
      setIsProcessing(false);
    }
  };

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
        action: handleDuplicate,
        description: `Criar uma cópia deste ${type === 'flow' ? 'pipeline' : 'base'}`,
        disabled: isProcessing
      },
      { 
        icon: ExternalLink, 
        label: 'Compartilhar', 
        action: handleShare,
        description: 'Gerar link de compartilhamento'
      },
      { 
        icon: Archive, 
        label: 'Arquivar', 
        action: () => setShowArchiveDialog(true),
        description: 'Mover para arquivos'
      },
      { 
        icon: Trash2, 
        label: 'Excluir', 
        action: () => setShowDeleteDialog(true),
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
              onClick={action.disabled ? undefined : action.action}
              disabled={action.disabled}
              className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                action.destructive ? 'text-red-600 focus:text-red-600' : ''
              } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2 w-full">
                <action.icon className="w-4 h-4" />
                <span className="font-medium">{action.label}</span>
                {action.disabled && isProcessing && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current ml-auto"></div>
                )}
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

      {/* Dialog de confirmação para arquivar */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar {type === 'flow' ? 'Pipeline' : 'Base'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Este {type === 'flow' ? 'pipeline' : 'base'} será movido para os arquivos e não aparecerá mais na lista principal.
              Você pode restaurá-lo a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleArchive}
              disabled={isProcessing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? 'Arquivando...' : 'Arquivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para excluir */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {type === 'flow' ? 'Pipeline' : 'Base'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Este {type === 'flow' ? 'pipeline' : 'base'} e todos os seus dados
              serão permanentemente removidos do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
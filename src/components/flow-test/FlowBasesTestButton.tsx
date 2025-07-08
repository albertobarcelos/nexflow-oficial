import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FlowBasesConfigModal } from '@/components/flow-builder/FlowBasesConfigModal';
import { Settings, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { useFlowBases } from '@/hooks/useFlowBases';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function FlowBasesTestButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState('3e36965b-be8f-40cc-a273-08ab2cfc0974'); // Flow de Vendas

  const { 
    availableBases, 
    linkedBases, 
    isLoading,
    linkBase,
    unlinkBase,
    updateBaseConfig,
    isLinking,
    isUnlinking,
    isUpdating
  } = useFlowBases(selectedFlowId);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Flows de teste disponíveis
  const testFlows = [
    { id: '3e36965b-be8f-40cc-a273-08ab2cfc0974', name: 'Flow de Vendas' },
    { id: '71e92614-9a61-4304-abdb-cf990353e7bf', name: 'Pré - Vendas' },
    { id: '95eb345c-8a7d-49c3-9005-17c84b216719', name: 'Teste Manual - Funil MVP' }
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sistema de Vinculação de Entidades aos Flows
          </CardTitle>
          <CardDescription>
            Teste da funcionalidade implementada com dados reais do banco Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção de Flow */}
          <div>
            <label className="text-sm font-medium">Flow para teste:</label>
            <div className="flex gap-2 mt-2">
              {testFlows.map((flow) => (
                <Button
                  key={flow.id}
                  variant={selectedFlowId === flow.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFlowId(flow.id)}
                >
                  {flow.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Status do Loading */}
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600">
              <AlertCircle className="h-4 w-4 animate-spin" />
              Carregando dados do banco...
            </div>
          )}

          {/* Estatísticas */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Entidades Disponíveis</div>
                <div className="text-2xl font-bold text-blue-900">{availableBases.length}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Entidades Vinculadas</div>
                <div className="text-2xl font-bold text-green-900">{linkedBases.length}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Entidade Principal</div>
                <div className="text-sm font-medium text-purple-900">
                  {linkedBases.find(b => b.is_primary)?.entity?.name || 'Nenhuma'}
                </div>
              </div>
            </div>
          )}

          {/* Lista de Entidades Vinculadas */}
          {!isLoading && linkedBases.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Entidades Vinculadas ao Flow:</h4>
              <div className="space-y-2">
                {linkedBases.map((base) => (
                  <div key={base.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: base.entity?.color || '#6366f1' }}
                      />
                      <span className="font-medium">{base.entity?.name}</span>
                      <div className="flex gap-1">
                        {base.is_primary && (
                          <Badge variant="default" className="text-xs">Principal</Badge>
                        )}
                        {base.is_required && (
                          <Badge variant="secondary" className="text-xs">Obrigatória</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Ordem: {base.order_index}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botão de Teste */}
          <div className="flex gap-2">
            <Button 
              onClick={handleOpenModal}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Settings className="h-4 w-4" />
              {isLoading ? 'Carregando...' : 'Testar Configuração de Bases'}
            </Button>

            {/* Indicadores de Status */}
            {(isLinking || isUnlinking || isUpdating) && (
              <div className="flex items-center gap-2 text-blue-600">
                <AlertCircle className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  {isLinking && 'Vinculando...'}
                  {isUnlinking && 'Desvinculando...'}
                  {isUpdating && 'Atualizando...'}
                </span>
              </div>
            )}
          </div>

          {/* Status de Sucesso */}
          {!isLoading && !isLinking && !isUnlinking && !isUpdating && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              Sistema integrado com banco de dados Supabase
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Configuração */}
      <FlowBasesConfigModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        flowId={selectedFlowId}
        flowName={testFlows.find(f => f.id === selectedFlowId)?.name || 'Flow Selecionado'}
      />
    </div>
  );
} 
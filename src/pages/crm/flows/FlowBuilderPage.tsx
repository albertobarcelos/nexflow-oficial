// =====================================================
// PÁGINA PARA CONSTRUÇÃO MODULAR DE FLOWS
// =====================================================
// AIDEV-NOTE: Página principal para acessar o FlowBuilder modular
// Permite criar flows personalizados com templates e automações

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FlowBuilder } from '@/components/flows/FlowBuilder';
import { toast } from 'sonner';

export function FlowBuilderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const flowId = searchParams.get('flowId');

  const handleFlowCreated = (flow: any) => {
    toast.success(`Flow "${flow.name}" criado com sucesso!`);
    // Redireciona para a página do flow criado
    navigate(`/crm/flows/${flow.id}/board`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/crm')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {flowId ? 'Editar Flow' : 'Construtor de Flows'}
                </h1>
                <p className="text-sm text-gray-500">
                  {flowId ? 'Modifique etapas e configurações do flow existente' : 'Crie flows personalizados com etapas modulares e automações'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🚀 Flow Builder Modular</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FlowBuilder onFlowCreated={handleFlowCreated} flowId={flowId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FlowBuilderPage;
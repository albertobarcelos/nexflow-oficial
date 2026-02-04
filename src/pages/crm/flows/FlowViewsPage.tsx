// =====================================================
// PÁGINA PARA GERENCIAR VISUALIZAÇÕES DE FLOWS
// =====================================================
// AIDEV-NOTE: Página para gerenciar visualizações duplicadas entre flows
// Permite configurar automações e sincronização de dados

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlowViews } from "@/components/flows/FlowViews";
import { useClientAccessGuard } from "@/hooks/useClientAccessGuard";

export function FlowViewsPage() {
  const navigate = useNavigate();
  const { hasAccess, accessError } = useClientAccessGuard();

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <p className="font-medium">Sem acesso aos flows</p>
          <p className="text-sm text-muted-foreground mt-1">{accessError ?? "Cliente não definido"}</p>
        </div>
      </div>
    );
  }

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
                  Visualizações de Flows
                </h1>
                <p className="text-sm text-gray-500">
                  Gerencie visualizações duplicadas e automações entre flows
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
              <span>👁️ Gerenciador de Visualizações</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FlowViews />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FlowViewsPage;
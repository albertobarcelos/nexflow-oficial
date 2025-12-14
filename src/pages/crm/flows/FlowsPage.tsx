import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Plus, Layers, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNexflowFlows } from "@/hooks/useNexflowFlows";
import { useFlowPermissions } from "@/hooks/useFlowPermissions";
import { supabase } from "@/lib/supabase";
import type { NexflowFlow } from "@/types/nexflow";
import { FlowSettingsModal } from "@/components/crm/flows/FlowSettingsModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function FlowsPage() {
  const navigate = useNavigate();
  const { flows, isLoading, deleteFlow } = useNexflowFlows();
  const { permissions } = useFlowPermissions();
  const [selectedFlow, setSelectedFlow] = useState<NexflowFlow | null>(null);
  const [flowToDelete, setFlowToDelete] = useState<NexflowFlow | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const canCreateFlow = permissions?.canCreateFlow ?? false;
  const isAdministrator = permissions?.isAdministrator ?? false;
  const isLeader = permissions?.isLeader ?? false;
  const isTeamAdmin = permissions?.isTeamAdmin ?? false;

  // Buscar ID do usuário atual
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
      }
    });
  }, []);

  // Função helper para verificar se pode editar/deletar um flow específico
  const canEditFlow = useMemo(() => {
    return (flow: NexflowFlow): boolean => {
      // Administrators podem editar/deletar todos os flows
      if (isAdministrator) {
        return true;
      }

      // Leaders e admins de time podem editar/deletar flows que são donos
      if ((isLeader || isTeamAdmin) && currentUserId && flow.ownerId === currentUserId) {
        return true;
      }

      // Members não podem editar/deletar
      return false;
    };
  }, [isAdministrator, isLeader, isTeamAdmin, currentUserId]);

  return (
    <div className="min-h-screen bg-[#f8faff] p-4 md:p-8">
      <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Flows</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie todos os seus flows e pipelines
            </p>
          </div>
          <Button
            onClick={() => navigate("/crm/flows/new")}
            disabled={!canCreateFlow}
            className="bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !canCreateFlow
                ? "Você não tem permissão para criar flows. Apenas leaders, admins de time e administrators podem criar flows."
                : "Criar novo flow"
            }
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Novo Flow
          </Button>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base md:text-lg font-medium">Meus Flows</h2>
              <Info className="w-4 h-4 text-gray-400" />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-100 rounded-xl p-4 md:p-6 min-h-[100px] md:min-h-[120px] animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {flows?.map((flow: NexflowFlow) => (
                  <div
                    key={flow.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-orange-400 hover:shadow-lg"
                  >
                    <div
                      className="space-y-2 cursor-pointer"
                      onClick={() => navigate(`/crm/flows/${flow.id}/board`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            {flow.category}
                          </p>
                          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                            {flow.name}
                          </h3>
                        </div>
                        {canEditFlow(flow) && (
                          <div className="flex gap-2">
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={(event) => {
                                event.stopPropagation();
                                setFlowToDelete(flow);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {flow.description || "Sem descrição"}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      {canEditFlow(flow) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/crm/flows/${flow.id}/builder`);
                          }}
                        >
                          <Layers className="mr-2 h-4 w-4" />
                          Editar Estrutura
                        </Button>
                      ) : (
                        <div></div>
                      )}
                      <div className="text-xs text-slate-400">
                        Criado em{" "}
                        {new Date(flow.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                ))}

                {!isLoading && flows?.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <p className="text-sm">Nenhum flow criado ainda.</p>
                    <p className="text-xs mt-1">
                      Clique em "Criar Novo Flow" para começar.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <FlowSettingsModal
        flow={selectedFlow}
        open={Boolean(selectedFlow)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedFlow(null);
          }
        }}
      />

      <AlertDialog
        open={Boolean(flowToDelete)}
        onOpenChange={(open) => {
          if (!open) setFlowToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir flow</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação removerá permanentemente o flow{" "}
              <strong>{flowToDelete?.name}</strong>. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!flowToDelete) return;
                await deleteFlow(flowToDelete.id);
                setFlowToDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default FlowsPage;


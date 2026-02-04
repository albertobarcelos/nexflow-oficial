import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Plus, Layers, Settings2, Trash2, Tag, Workflow, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientAccessGuard } from "@/hooks/useClientAccessGuard";
import { useNexflowFlows } from "@/hooks/useNexflowFlows";
import { useFlowPermissions } from "@/hooks/useFlowPermissions";
import { supabase } from "@/lib/supabase";
import type { NexflowFlow } from "@/types/nexflow";
import { FlowSettingsModal } from "@/components/crm/flows/FlowSettingsModal";
import { FlowTagsModal } from "@/components/crm/flows/FlowTagsModal";
import { ImportCardsCsvModal } from "@/components/crm/flows/ImportCardsCsvModal";
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
  const { hasAccess, accessError } = useClientAccessGuard();
  const { flows, isLoading, deleteFlow } = useNexflowFlows();
  const { permissions } = useFlowPermissions();

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
  const [selectedFlow, setSelectedFlow] = useState<NexflowFlow | null>(null);
  const [flowToDelete, setFlowToDelete] = useState<NexflowFlow | null>(null);
  const [flowForTags, setFlowForTags] = useState<NexflowFlow | null>(null);
  const [flowToImport, setFlowToImport] = useState<NexflowFlow | null>(null);
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="bg-card rounded-2xl p-4 md:p-8 shadow-sm border border-border">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Flows</h1>
            <p className="text-sm text-muted-foreground mt-1">
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
              <h2 className="text-base md:text-lg font-medium text-foreground">Meus Flows</h2>
              <Info className="w-4 h-4 text-muted-foreground" />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted rounded-xl p-4 md:p-6 min-h-[100px] md:min-h-[120px] animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-2 overflow-visible">
                {flows?.map((flow: NexflowFlow) => (
                  <div
                    key={flow.id}
                    className="rounded-2xl border border-border bg-card p-4 min-h-[180px] overflow-visible transition hover:-translate-y-1 hover:border-primary hover:shadow-lg"
                  >
                    <div
                      className="space-y-2 cursor-pointer"
                      onClick={() => navigate(`/crm/flows/${flow.id}/board`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {flow.category}
                          </p>
                          <h3 className="text-sm font-semibold text-foreground line-clamp-2">
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
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {flow.description || "Sem descrição"}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      {canEditFlow(flow) ? (
                        <div className="flex flex-wrap items-center gap-2 min-h-[2.5rem]">
                          {/* Botão Editar Estrutura */}
                          <div className="group relative overflow-hidden rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors duration-200">
                            <button
                              className="flex items-center h-8 px-2 text-xs"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/crm/flows/${flow.id}/builder`);
                              }}
                            >
                              <Layers className="h-4 w-4 flex-shrink-0" />
                              <span className="ml-2 whitespace-nowrap max-w-0 group-hover:max-w-[200px] opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out overflow-hidden inline-block">
                                Editar Estrutura
                              </span>
                            </button>
                          </div>

                          {/* Botão Editar Tags */}
                          <div className="group relative overflow-hidden rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors duration-200">
                            <button
                              className="flex items-center h-8 px-2 text-xs"
                              onClick={(event) => {
                                event.stopPropagation();
                                setFlowForTags(flow);
                              }}
                            >
                              <Tag className="h-4 w-4 flex-shrink-0" />
                              <span className="ml-2 whitespace-nowrap max-w-0 group-hover:max-w-[200px] opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out overflow-hidden inline-block">
                                Editar Tags
                              </span>
                            </button>
                          </div>

                          {/* Botão Editar Processos */}
                          <div className="group relative overflow-hidden rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors duration-200">
                            <button
                              className="flex items-center h-8 px-2 text-xs"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/crm/flows/${flow.id}/processes`);
                              }}
                            >
                              <Workflow className="h-4 w-4 flex-shrink-0" />
                              <span className="ml-2 whitespace-nowrap max-w-0 group-hover:max-w-[200px] opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out overflow-hidden inline-block">
                                Editar Processos
                              </span>
                            </button>
                          </div>

                          {/* Botão Importar CSV atualmente bloqueado*/}
                          <div
                            className="group relative overflow-hidden rounded-md border border-input bg-background cursor-not-allowed opacity-50"
                            title="Importação de CSV temporariamente indisponível"
                          >
                            <button
                              className="flex items-center h-8 px-2 text-xs pointer-events-none"
                              type="button"
                              disabled
                              tabIndex={-1}
                            >
                              <Upload className="h-4 w-4 flex-shrink-0" />
                              <span className="ml-2 whitespace-nowrap max-w-0 opacity-0 transition-all duration-300 ease-in-out overflow-hidden inline-block">
                                BLOQUEADO TEMPORARIAMENTE
                              </span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div></div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Criado em{" "}
                        {new Date(flow.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                ))}

                {!isLoading && flows?.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
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

      <FlowTagsModal
        open={Boolean(flowForTags)}
        onOpenChange={(open) => {
          if (!open) {
            setFlowForTags(null);
          }
        }}
        flowId={flowForTags?.id || ""}
        flowName={flowForTags?.name || ""}
      />

      <ImportCardsCsvModal
        open={Boolean(flowToImport)}
        onOpenChange={(open) => {
          if (!open) {
            setFlowToImport(null);
          }
        }}
        flowId={flowToImport?.id || ""}
        flowName={flowToImport?.name || ""}
        clientId={flowToImport?.clientId ?? undefined}
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


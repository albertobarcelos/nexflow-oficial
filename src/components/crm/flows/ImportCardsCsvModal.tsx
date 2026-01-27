import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { supabase, nexflowClient } from "@/lib/supabase";
import { toast } from "sonner";
import { useNexflowSteps } from "@/hooks/useNexflowSteps";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import type { NexflowStep, StepType } from "@/types/nexflow";
import type { Database } from "@/types/database";

interface ImportCardsCsvModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowName: string;
}

interface ImportResult {
  success: boolean;
  summary: {
    totalRows: number;
    successfulImports: number;
    failedImports: number;
    createdFields: number;
  };
  results?: Array<{
    rowNumber: number;
    status: "success" | "error";
    cardId?: string;
    error?: string;
    stepId: string;
  }>;
  createdFields?: Array<{
    fieldId: string;
    label: string;
    slug: string;
    stepId: string;
  }>;
  errors?: Array<{
    rowNumber: number;
    error: string;
    data: Record<string, unknown>;
  }>;
}

export function ImportCardsCsvModal({ open, onOpenChange, flowId, flowName }: ImportCardsCsvModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Validação inicial: garantir que flowId está presente
  if (!flowId && open) {
    console.error("ImportCardsCsvModal: flowId não fornecido");
  }

  // Função auxiliar para mapear StepRow para NexflowStep
  const mapStepRow = (row: Database["public"]["Tables"]["steps"]["Row"]): NexflowStep => ({
    id: row.id,
    flowId: row.flow_id,
    title: row.title,
    color: row.color ?? "#2563eb",
    position: row.position,
    isCompletionStep: Boolean(row.is_completion_step),
    stepType: (row.step_type as StepType) ?? "standard",
    createdAt: row.created_at,
    responsibleUserId: row.responsible_user_id ?? null,
    responsibleTeamId: row.responsible_team_id ?? null,
  });

  // Query alternativa como fallback caso o hook não funcione
  const fallbackStepsQuery = useQuery<NexflowStep[]>({
    queryKey: ["import-modal", "steps", flowId],
    enabled: open && Boolean(flowId),
    queryFn: async (): Promise<NexflowStep[]> => {
      if (!flowId) {
        console.log("[ImportCardsCsvModal] Fallback query: flowId não fornecido");
        return [];
      }

      console.log("[ImportCardsCsvModal] Fallback query: buscando steps para flowId:", flowId);
      
      const { data, error } = await nexflowClient()
        .from("steps")
        .select("*")
        .eq("flow_id", flowId)
        .order("position", { ascending: true });

      if (error) {
        console.error("[ImportCardsCsvModal] Erro ao buscar steps no fallback:", error);
        throw error;
      }

      console.log("[ImportCardsCsvModal] Fallback query: steps encontrados:", data?.length || 0);

      // Mapear para NexflowStep usando a mesma função do hook
      return (data || []).map(mapStepRow);
    },
    refetchOnMount: true,
    staleTime: 0, // Sempre buscar dados frescos quando modal abrir
  });

  // Tentar usar hook primeiro, fallback para query alternativa
  const { data: hookSteps, isLoading: isLoadingHookSteps, isError: isHookStepsError, refetch: refetchSteps } = useNexflowSteps(flowId);
  
  // Usar fallback se hook não retornar dados válidos
  // Priorizar hook se tiver dados, senão usar fallback
  const hookStepsArray = Array.isArray(hookSteps) ? hookSteps : [];
  const fallbackStepsArray = Array.isArray(fallbackStepsQuery.data) ? fallbackStepsQuery.data : [];
  
  const steps = hookStepsArray.length > 0 ? hookStepsArray : fallbackStepsArray;
  
  const isLoadingSteps = isLoadingHookSteps || fallbackStepsQuery.isLoading;
  const isStepsError = isHookStepsError || fallbackStepsQuery.isError;
  
  const defaultStep = steps?.[0]; // Primeiro step como padrão

  // Forçar refetch dos steps quando o modal abrir
  useEffect(() => {
    if (open && flowId) {
      console.log("[ImportCardsCsvModal] Forçando refetch de steps", { flowId, open });
      refetchSteps().catch((error) => {
        console.error("Erro ao refetch steps do hook:", error);
      });
      fallbackStepsQuery.refetch().catch((error) => {
        console.error("Erro ao refetch steps do fallback:", error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flowId]); // Remover refetchSteps e fallbackStepsQuery das dependências para evitar loops

  // Debug: log quando steps mudarem (apenas em desenvolvimento)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("ImportCardsCsvModal - Steps carregados:", {
        hookSteps,
        hookStepsLength: hookSteps?.length,
        fallbackSteps: fallbackStepsQuery.data,
        fallbackStepsLength: fallbackStepsQuery.data?.length,
        finalSteps: steps,
        stepsLength: steps?.length,
        defaultStep,
        isLoadingSteps,
        isStepsError,
        flowId,
        open,
      });
    }
  }, [hookSteps, fallbackStepsQuery.data, steps, defaultStep, isLoadingSteps, isStepsError, flowId, open]);

  // Resetar estado quando modal fechar
  const handleClose = () => {
    if (!isImporting) {
      setFile(null);
      setImportResult(null);
      // Limpar input file para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onOpenChange(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar tipo de arquivo
      const isValidCsv = 
        selectedFile.type === "text/csv" || 
        selectedFile.type === "application/vnd.ms-excel" ||
        selectedFile.name.toLowerCase().endsWith(".csv");
      
      if (!isValidCsv) {
        toast.error("Por favor, selecione um arquivo CSV válido");
        setFile(null);
        // Limpar o input para permitir selecionar o mesmo arquivo novamente
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      
      // Validar tamanho (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        toast.error("O arquivo é muito grande. Tamanho máximo: 10MB");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      
      setFile(selectedFile);
      setImportResult(null);
    } else {
      setFile(null);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extrair apenas a parte base64 se for data URL
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImport = async () => {
    // Logs de debug detalhados
    console.log("[ImportCardsCsvModal] handleImport chamado", {
      file: file ? { name: file.name, size: file.size } : null,
      flowId,
      steps,
      stepsLength: steps?.length,
      defaultStep,
      isLoadingSteps,
      isStepsError,
    });

    // Validações mais específicas
    if (!file) {
      console.error("[ImportCardsCsvModal] Arquivo não selecionado");
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    if (!defaultStep) {
      console.error("[ImportCardsCsvModal] Step padrão não encontrado", {
        steps,
        stepsLength: steps?.length,
        flowId,
        isLoadingSteps,
        isStepsError,
      });
      toast.error("O flow precisa ter pelo menos uma etapa. Por favor, crie uma etapa antes de importar.");
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      // Converter arquivo para base64
      const csvBase64 = await convertFileToBase64(file);

      // Preparar payload
      const payload = {
        csvFile: csvBase64,
        config: {
          flowId,
          defaultStepId: defaultStep.id,
          columnMapping: {
            nativeFields: {
              title: "Título", // Coluna padrão - pode ser customizado depois
            },
            unmappedColumns: "ignore" as const,
          },
          batchSize: 100,
          skipHeaderRow: true,
        },
      };

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke("import-cards-csv", {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || "Erro ao importar CSV");
      }

      if (!data || !data.success) {
        throw new Error(data?.error || "Falha ao importar CSV");
      }

      setImportResult(data as ImportResult);

      // Invalidar queries para atualizar a lista de cards
      queryClient.invalidateQueries({ queryKey: ["nexflow", "cards", flowId] });
      queryClient.invalidateQueries({ queryKey: ["nexflow", "cards"] });

      toast.success(
        `Importação concluída: ${data.summary.successfulImports} de ${data.summary.totalRows} cards importados com sucesso`
      );
    } catch (error) {
      console.error("Erro ao importar CSV:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao importar CSV");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Cards via CSV</DialogTitle>
          <DialogDescription>
            Importe múltiplos cards para o flow <strong>{flowName}</strong> a partir de um arquivo CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload de arquivo */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <div className="flex items-center gap-4">
              <Input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={isImporting}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {file ? file.name : "Selecionar arquivo CSV"}
              </Button>
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">
                  {file.name} ({(file.size / 1024).toFixed(2)} KB) ✓
                </span>
              </div>
            )}
            {isLoadingSteps && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando etapas do flow...</span>
              </div>
            )}
            {isStepsError && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>Erro ao carregar etapas. </span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-red-600 dark:text-red-400 underline"
                  onClick={() => refetchSteps()}
                >
                  Tentar novamente
                </Button>
              </div>
            )}
            {!isLoadingSteps && !isStepsError && !defaultStep && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span>O flow precisa ter pelo menos uma etapa para importar cards.</span>
              </div>
            )}
            {!isLoadingSteps && !isStepsError && defaultStep && steps && steps.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {steps.length} etapa{steps.length !== 1 ? "s" : ""} encontrada{steps.length !== 1 ? "s" : ""}. 
                  Cards serão importados para: <strong>{defaultStep.title}</strong>
                </span>
              </div>
            )}
            {!isLoadingSteps && !isStepsError && !defaultStep && steps && steps.length === 0 && flowId && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Nenhuma etapa encontrada para este flow. Verifique se o flow tem etapas criadas.
                </span>
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Formato esperado:</strong> A primeira linha deve conter os cabeçalhos das colunas.
                </p>
                <p>
                  <strong>Coluna obrigatória:</strong> "Título" (ou a primeira coluna será usada como título).
                </p>
                <p>
                  <strong>Etapa padrão:</strong> Os cards serão importados para a primeira etapa do flow.
                </p>
              </div>
            </div>
          </div>

          {/* Resultado da importação */}
          {importResult && (
            <div className="rounded-lg border border-border p-4 space-y-4">
              <div className="flex items-center gap-2">
                {importResult.summary.failedImports === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-yellow-500" />
                )}
                <h3 className="font-semibold">Resultado da Importação</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total de linhas</p>
                  <p className="text-lg font-semibold">{importResult.summary.totalRows}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Importados com sucesso</p>
                  <p className="text-lg font-semibold text-green-500">
                    {importResult.summary.successfulImports}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Falhas</p>
                  <p className="text-lg font-semibold text-red-500">
                    {importResult.summary.failedImports}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Campos criados</p>
                  <p className="text-lg font-semibold">{importResult.summary.createdFields}</p>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-red-500">Erros encontrados:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-xs text-muted-foreground bg-red-50 dark:bg-red-950/20 p-2 rounded">
                        <strong>Linha {error.rowNumber}:</strong> {error.error}
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        ... e mais {importResult.errors.length - 10} erros
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
              {importResult ? "Fechar" : "Cancelar"}
            </Button>
            {!importResult && (
              <Button 
                onClick={handleImport} 
                disabled={!file || !defaultStep || isImporting}
                title={!file ? "Selecione um arquivo CSV" : !defaultStep ? "O flow precisa ter pelo menos uma etapa" : ""}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { supabase, nexflowClient } from "@/lib/supabase";
import { toast } from "sonner";
import { useNexflowSteps } from "@/hooks/useNexflowSteps";
import { useNexflowStepFields } from "@/hooks/useNexflowStepFields";
import { useItems } from "@/hooks/useItems";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import type { NexflowStep, StepType } from "@/types/nexflow";
import type { Database } from "@/types/database";
import { parseCsv, readFileAsText } from "@/lib/csv";
import { cn } from "@/lib/utils";

interface ImportCardsCsvModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowName: string;
  /** client_id do flow para listar produtos (web_items) no modo "valor para produto existente" */
  clientId?: string | null;
}

/** Destino do mapeamento de cada coluna CSV */
export type ColumnMappingTarget =
  | "title"
  | "product"
  | "value"
  | "contact"
  | "company"
  | "step_routing"
  | "step_field"
  | "ignore";

export interface ColumnMappingChoice {
  target: ColumnMappingTarget;
  stepFieldId?: string;
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

const COLUMN_TARGET_LABELS: Record<ColumnMappingTarget, string> = {
  title: "Título do card",
  product: "Produto (criar se não existir)",
  value: "Valor",
  contact: "Contato (tabela contacts)",
  company: "Empresa (web_companies)",
  step_routing: "Etapa (roteamento)",
  step_field: "Campo do step",
  ignore: "Ignorar",
};

/** Modo de mapeamento de produto: por nome (criar se não existir) ou valor para produto existente */
export type ProductMappingMode = "by_name" | "value_to_existing";

export function ImportCardsCsvModal({
  open,
  onOpenChange,
  flowId,
  flowName,
  clientId,
}: ImportCardsCsvModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<Array<Record<string, string>>>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, ColumnMappingChoice>>({});
  /** Coluna usada para roteamento por etapa (apenas uma) */
  const [stepRoutingColumn, setStepRoutingColumn] = useState<string | null>(null);
  /** Mapeamento valor da coluna → stepId para roteamento */
  const [stepRoutingRules, setStepRoutingRules] = useState<Record<string, string>>({});
  /** Etapa padrão selecionada (onde os cards serão criados quando não houver roteamento) */
  const [selectedDefaultStepId, setSelectedDefaultStepId] = useState<string | null>(null);
  /** Modo produto: por nome ou valor para produto existente */
  const [productMode, setProductMode] = useState<ProductMappingMode>("by_name");
  /** Item (produto) selecionado no modo "valor para produto existente" */
  const [productValueItemId, setProductValueItemId] = useState<string | null>(null);
  /** Coluna CSV que contém o valor no modo "valor para produto existente" */
  const [productValueColumn, setProductValueColumn] = useState<string | null>(null);
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data: items = [] } = useItems(clientId);

  if (!flowId && open) {
    console.error("ImportCardsCsvModal: flowId não fornecido");
  }

  const mapStepRow = (
    row: Database["public"]["Tables"]["steps"]["Row"]
  ): NexflowStep => ({
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

  const fallbackStepsQuery = useQuery<NexflowStep[]>({
    queryKey: ["import-modal", "steps", flowId],
    enabled: open && Boolean(flowId),
    queryFn: async (): Promise<NexflowStep[]> => {
      if (!flowId) return [];
      const { data, error } = await nexflowClient()
        .from("steps")
        .select("*")
        .eq("flow_id", flowId)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data || []).map(mapStepRow);
    },
    refetchOnMount: true,
    staleTime: 0,
  });

  const {
    steps: hookSteps,
    isLoading: isLoadingHookSteps,
    isError: isHookStepsError,
    refetch: refetchSteps,
  } = useNexflowSteps(flowId);

  const hookStepsArray = Array.isArray(hookSteps) ? hookSteps : [];
  const fallbackStepsArray = Array.isArray(fallbackStepsQuery.data)
    ? fallbackStepsQuery.data
    : [];
  const steps = hookStepsArray.length > 0 ? hookStepsArray : fallbackStepsArray;
  const isLoadingSteps = isLoadingHookSteps || fallbackStepsQuery.isLoading;
  const isStepsError = isHookStepsError || fallbackStepsQuery.isError;
  /** Etapa padrão: a selecionada pelo usuário ou a primeira da lista */
  const defaultStep =
    steps?.find((s) => s.id === selectedDefaultStepId) ?? steps?.[0];

  const { fields: stepFields = [] } = useNexflowStepFields(defaultStep?.id);

  // Sincronizar etapa padrão quando as etapas carregam (primeira abertura ou refetch)
  useEffect(() => {
    if (steps.length > 0 && !selectedDefaultStepId) {
      setSelectedDefaultStepId(steps[0].id);
    }
  }, [steps, selectedDefaultStepId]);

  useEffect(() => {
    if (open && flowId) {
      refetchSteps().catch(console.error);
      fallbackStepsQuery.refetch().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flowId]);

  const handleClose = () => {
    if (!isImporting) {
      setStep(1);
      setFile(null);
      setCsvHeaders([]);
      setCsvPreviewRows([]);
      setColumnMapping({});
      setStepRoutingColumn(null);
      setStepRoutingRules({});
      setSelectedDefaultStepId(null);
      setProductMode("by_name");
      setProductValueItemId(null);
      setProductValueColumn(null);
      setImportResult(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onOpenChange(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      setCsvHeaders([]);
      setCsvPreviewRows([]);
      setColumnMapping({});
      return;
    }

    const isValidCsv =
      selectedFile.type === "text/csv" ||
      selectedFile.type === "application/vnd.ms-excel" ||
      selectedFile.name.toLowerCase().endsWith(".csv");
    if (!isValidCsv) {
      toast.error("Por favor, selecione um arquivo CSV válido");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error("O arquivo é muito grande. Tamanho máximo: 10MB");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selectedFile);
    setImportResult(null);
    setIsLoadingCsv(true);
    try {
      const text = await readFileAsText(selectedFile);
      const { headers, rows } = parseCsv(text, {
        maxPreviewRows: 5,
        skipEmptyHeaders: true,
      });
      setCsvHeaders(headers);
      setCsvPreviewRows(rows);
      const initialMapping: Record<string, ColumnMappingChoice> = {};
      headers.forEach((h) => {
        initialMapping[h] = { target: "ignore" };
      });
      setColumnMapping(initialMapping);
    } catch (err) {
      toast.error("Erro ao ler o arquivo CSV");
      setCsvHeaders([]);
      setCsvPreviewRows([]);
      setColumnMapping({});
    } finally {
      setIsLoadingCsv(false);
    }
  };

  const handleColumnMappingChange = (
    header: string,
    choice: ColumnMappingChoice
  ) => {
    setColumnMapping((prev) => {
      const next = { ...prev, [header]: choice };
      if (choice.target === "step_routing") {
        // Apenas uma coluna pode ser roteamento: limpar as outras
        Object.keys(next).forEach((col) => {
          if (col !== header && next[col]?.target === "step_routing") {
            next[col] = { target: "ignore" };
          }
        });
        setStepRoutingColumn(header);
        setStepRoutingRules({});
      } else {
        if (stepRoutingColumn === header) {
          setStepRoutingColumn(null);
          setStepRoutingRules({});
        }
      }
      return next;
    });
  };

  const canAdvanceFromStep1 =
    file && csvHeaders.length > 0 && !isLoadingCsv && defaultStep;
  const titleMappedColumn = Object.entries(columnMapping).find(
    ([_, c]) => c.target === "title"
  )?.[0];
  const canAdvanceFromStep2 = Boolean(titleMappedColumn);
  const canAdvanceToStep3 = canAdvanceFromStep2;

  /** Valores únicos da coluna de roteamento (preview) para mapear valor → etapa */
  const stepRoutingUniqueValues = stepRoutingColumn
    ? (() => {
        const values = csvPreviewRows
          .map((row) => row[stepRoutingColumn]?.trim())
          .filter((v) => v != null && v !== "");
        return [...new Set(values)];
      })()
    : [];

  const convertFileToBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64 ?? "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  };

  const handleImport = async () => {
    if (!file || !defaultStep) {
      toast.error("Arquivo e etapa são obrigatórios.");
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const csvBase64 = await convertFileToBase64(file);

      const nativeFields: Record<string, string> = {};
      const stepFieldsMap: Record<string, string> = {};
      for (const [csvCol, choice] of Object.entries(columnMapping)) {
        if (choice.target === "title") nativeFields.title = csvCol;
        else if (choice.target === "product" && productMode === "by_name")
          nativeFields.product = csvCol;
        else if (choice.target === "value") nativeFields.value = csvCol;
        else if (choice.target === "contact") nativeFields.contact = csvCol;
        else if (choice.target === "company") nativeFields.company = csvCol;
        else if (choice.target === "step_field" && choice.stepFieldId) {
          const sf = stepFields.find((f) => f.id === choice.stepFieldId);
          if (sf?.slug) stepFieldsMap[sf.slug] = csvCol;
        }
      }

      const stepRouting =
        stepRoutingColumn && Object.keys(stepRoutingRules).length > 0
          ? {
              column: stepRoutingColumn,
              rules: Object.entries(stepRoutingRules)
                .filter(([, stepId]) => stepId)
                .map(([value, stepId]) => ({ value, stepId, matchType: "exact" as const })),
              defaultStepId: defaultStep.id,
            }
          : undefined;

      /** No modo "valor para produto existente", envia itemId e coluna do valor */
      const productValueToExistingItem =
        productMode === "value_to_existing" &&
        productValueItemId &&
        productValueColumn
          ? { itemId: productValueItemId, valueColumn: productValueColumn }
          : undefined;

      const payload = {
        csvFile: csvBase64,
        config: {
          flowId,
          defaultStepId: defaultStep.id,
          columnMapping: {
            nativeFields,
            stepFields: Object.keys(stepFieldsMap).length > 0 ? stepFieldsMap : undefined,
            unmappedColumns: "ignore" as const,
          },
          stepRouting,
          productValueToExistingItem,
          batchSize: 100,
          skipHeaderRow: true,
        },
      };

      const { data, error } = await supabase.functions.invoke(
        "import-cards-csv",
        { body: payload }
      );

      if (error) throw new Error(error.message || "Erro ao importar CSV");
      if (!data || !data.success) {
        throw new Error(data?.error || "Falha ao importar CSV");
      }

      setImportResult(data as ImportResult);
      queryClient.invalidateQueries({ queryKey: ["nexflow", "cards", flowId] });
      queryClient.invalidateQueries({ queryKey: ["nexflow", "cards"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["card-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts-for-select"] });
      queryClient.invalidateQueries({ queryKey: ["contact-companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success(
        `Importação concluída: ${data.summary.successfulImports} de ${data.summary.totalRows} cards importados com sucesso`
      );
    } catch (error) {
      console.error("Erro ao importar CSV:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao importar CSV"
      );
    } finally {
      setIsImporting(false);
    }
  };

  const showResult = importResult != null;
  const showWizard = !showResult;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-10xl w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-auto">
        <DialogHeader>
          <DialogTitle>Importar Cards via CSV</DialogTitle>
          <DialogDescription>
            Importe múltiplos cards para o flow <strong>{flowName}</strong> a
            partir de um arquivo CSV
          </DialogDescription>
        </DialogHeader>

        {showResult && (
          <div className="space-y-6">
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
                  <p className="text-lg font-semibold">
                    {importResult.summary.totalRows}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Importados com sucesso
                  </p>
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
                  <p className="text-lg font-semibold">
                    {importResult.summary.createdFields}
                  </p>
                </div>
              </div>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-red-500">
                    Erros encontrados:
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <div
                        key={index}
                        className="text-xs text-muted-foreground bg-red-50  p-2 rounded"
                      >
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
            <div className="flex justify-end">
              <Button onClick={handleClose}>Fechar</Button>
            </div>
          </div>
        )}

        {showWizard && (
          <div className="space-y-6">
            {/* Indicador de passos */}
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={cn(
                    "h-2 flex-1 rounded-full",
                    step >= s ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>

            {/* Passo 1: Selecionar e carregar CSV */}
            {step === 1 && (
              <div className="space-y-4">
                <Label htmlFor="csv-file">Arquivo CSV</Label>
                <div className="flex gap-4">
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
                {isLoadingCsv && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando arquivo...
                  </div>
                )}
                {file && csvHeaders.length > 0 && !isLoadingCsv && (
                  <div className="w-full min-w-0 rounded-lg border border-border p-3 space-y-2">
                    <p className="text-sm font-medium">
                      {csvHeaders.length} coluna{csvHeaders.length !== 1 ? "s" : ""}{" "}
                      encontrada{csvHeaders.length !== 1 ? "s" : ""}. Preview (até 5
                      linhas):
                    </p>
                    <div className="text-xs overflow-x-auto overflow-y-auto max-h-[50vh] max-w-full rounded border border-border">
                      <table className="w-max min-w-full border-collapse">
                        <thead>
                          <tr>
                            {csvHeaders.map((h) => (
                              <th
                                key={h}
                                className="border border-border px-2 py-1 text-left whitespace-nowrap"
                              >
                                {h || "(vazio)"}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreviewRows.map((row, i) => (
                            <tr key={i}>
                              {csvHeaders.map((h) => (
                                <td
                                  key={h}
                                  className="border border-border px-2 py-1 whitespace-nowrap"
                                >
                                  {row[h] ?? ""}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {!defaultStep && !isLoadingSteps && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 ">
                    <AlertCircle className="h-4 w-4" />
                    O flow precisa ter pelo menos uma etapa para importar.
                  </div>
                )}
                {isStepsError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 ">
                    <AlertCircle className="h-4 w-4" />
                    Erro ao carregar etapas.{" "}
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => refetchSteps()}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Passo 2: Mapear colunas */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Etapa padrão: onde os cards serão criados quando não houver roteamento */}
                {steps.length > 0 && (
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <Label className="text-sm font-medium">
                      Etapa padrão para os cards
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Se não usar roteamento por valor, os cards serão criados
                      nesta etapa (ex.: Finance).
                    </p>
                    <Select
                      value={selectedDefaultStepId ?? ""}
                      onValueChange={(id) => setSelectedDefaultStepId(id || null)}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Selecione a etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {steps.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Defina para cada coluna do CSV o que ela representa no card.
                  Pelo menos uma coluna deve ser &quot;Título do card&quot;.
                </p>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {csvHeaders.map((header) => (
                    <div
                      key={header}
                      className="flex items-center gap-3 flex-wrap"
                    >
                      <span className="text-sm font-medium min-w-[120px] truncate">
                        {header || "(vazio)"}
                      </span>
                      <Select
                        value={
                          columnMapping[header]?.target === "step_field" &&
                          columnMapping[header]?.stepFieldId
                            ? `step_field:${columnMapping[header].stepFieldId}`
                            : columnMapping[header]?.target ?? "ignore"
                        }
                        onValueChange={(value) => {
                          if (value.startsWith("step_field:")) {
                            const stepFieldId = value.replace(
                              "step_field:",
                              ""
                            );
                            handleColumnMappingChange(header, {
                              target: "step_field",
                              stepFieldId,
                            });
                          } else {
                            handleColumnMappingChange(header, {
                              target: value as ColumnMappingTarget,
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Ignorar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ignore">
                            {COLUMN_TARGET_LABELS.ignore}
                          </SelectItem>
                          <SelectItem value="title">
                            {COLUMN_TARGET_LABELS.title}
                          </SelectItem>
                          <SelectItem value="product">
                            {COLUMN_TARGET_LABELS.product}
                          </SelectItem>
                          <SelectItem value="value">
                            {COLUMN_TARGET_LABELS.value}
                          </SelectItem>
                          <SelectItem value="contact">
                            {COLUMN_TARGET_LABELS.contact}
                          </SelectItem>
                          <SelectItem value="company">
                            {COLUMN_TARGET_LABELS.company}
                          </SelectItem>
                          <SelectItem value="step_routing">
                            {COLUMN_TARGET_LABELS.step_routing}
                          </SelectItem>
                          {stepFields.map((sf) => (
                            <SelectItem
                              key={sf.id}
                              value={`step_field:${sf.id}`}
                            >
                              Campo do step: {sf.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                {/* Modo de mapeamento de produto */}
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <Label className="text-sm font-medium">Produto</Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="productMode"
                        checked={productMode === "by_name"}
                        onChange={() => setProductMode("by_name")}
                        className="rounded-full border-input"
                      />
                      <span className="text-sm">
                        Produto por nome (criar se não existir)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="productMode"
                        checked={productMode === "value_to_existing"}
                        onChange={() => setProductMode("value_to_existing")}
                        className="rounded-full border-input"
                      />
                      <span className="text-sm">
                        Valor para produto existente
                      </span>
                    </label>
                  </div>
                  {productMode === "value_to_existing" && (
                    <div className="grid gap-3 sm:grid-cols-2 pt-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Produto (base)</Label>
                        <Select
                          value={productValueItemId ?? ""}
                          onValueChange={(id) =>
                            setProductValueItemId(id || null)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name}
                                {item.price != null
                                  ? ` (${Number(item.price).toLocaleString("pt-BR")})`
                                  : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">
                          Coluna CSV com o valor
                        </Label>
                        <Select
                          value={productValueColumn ?? ""}
                          onValueChange={(col) =>
                            setProductValueColumn(col || null)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione a coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            {csvHeaders.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h || "(vazio)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
                {stepRoutingColumn && stepRoutingUniqueValues.length > 0 && (
                  <div className="rounded-lg border border-border p-3 space-y-3">
                    <p className="text-sm font-medium">
                      Mapeamento valor → etapa (coluna &quot;{stepRoutingColumn}&quot;)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Defina para cada valor em qual etapa o card será criado.
                    </p>
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                      {stepRoutingUniqueValues.map((csvValue) => (
                        <div
                          key={csvValue}
                          className="flex items-center gap-3 flex-wrap"
                        >
                          <span className="text-sm min-w-[140px] truncate">
                            &quot;{csvValue}&quot;
                          </span>
                          <Select
                            value={stepRoutingRules[csvValue] ?? ""}
                            onValueChange={(stepId) => {
                              setStepRoutingRules((prev) => ({
                                ...prev,
                                [csvValue]: stepId,
                              }));
                            }}
                          >
                            <SelectTrigger className="w-[260px]">
                              <SelectValue placeholder="Selecione a etapa" />
                            </SelectTrigger>
                            <SelectContent>
                              {steps.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!canAdvanceFromStep2 && csvHeaders.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 ">
                    <AlertCircle className="h-4 w-4" />
                    Selecione uma coluna como &quot;Título do card&quot;.
                  </div>
                )}
              </div>
            )}

            {/* Passo 3: Resumo e iniciar importação */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Revise o mapeamento e inicie a importação em fila.
                </p>
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <p className="text-sm font-medium">Resumo do mapeamento:</p>
                  <ul className="text-sm space-y-1">
                    {Object.entries(columnMapping)
                      .filter(([, c]) => c.target !== "ignore")
                      .map(([col, c]) => (
                        <li key={col}>
                          <strong>{col}</strong> →{" "}
                          {c.target === "step_field" && c.stepFieldId
                            ? `Campo: ${
                                stepFields.find((f) => f.id === c.stepFieldId)
                                  ?.label ?? c.stepFieldId
                              }`
                            : COLUMN_TARGET_LABELS[c.target]}
                        </li>
                      ))}
                  </ul>
                  {stepRoutingColumn &&
                    Object.entries(stepRoutingRules).filter(([, id]) => id).length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-sm font-medium">Roteamento por etapa:</p>
                        <ul className="text-xs space-y-1 mt-1">
                          {Object.entries(stepRoutingRules)
                            .filter(([, stepId]) => stepId)
                            .map(([val, stepId]) => (
                              <li key={val}>
                                &quot;{val}&quot; →{" "}
                                {steps.find((s) => s.id === stepId)?.title ?? stepId}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                </div>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>
                      Cards serão importados para:{" "}
                      <strong>{defaultStep?.title}</strong>
                      {stepRoutingColumn &&
                        " (ou etapa definida pelo roteamento)"}
                    </span>
                  </div>
                  {productMode === "value_to_existing" &&
                    productValueItemId &&
                    productValueColumn && (
                      <div className="text-xs pl-6">
                        Produto: valor da coluna &quot;{productValueColumn}&quot;
                        → produto selecionado
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Botões do wizard */}
            <div className="flex justify-between gap-2 pt-2">
              <div>
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                    disabled={isImporting}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {step < 3 ? (
                  <Button
                    onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                    disabled={
                      (step === 1 && !canAdvanceFromStep1) ||
                      (step === 2 && !canAdvanceToStep3)
                    }
                  >
                    Avançar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      disabled={isImporting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={!defaultStep || isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Iniciar importação em fila
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

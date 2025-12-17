import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FlowDraft } from "@/hooks/useFlowBuilderState";
import type { NexflowStepField } from "@/types/nexflow";
import type { UpdateStepFieldInput } from "@/hooks/useNexflowStepFields";
import type { StepFieldConfiguration } from "@/types/nexflow";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { FieldConfigRenderer } from "./FieldConfigRenderer";
import {
  FieldFormValues,
  buildConfigurationFromForm,
  toFieldFormValues,
} from "./types";
import { Separator } from "@/components/ui/separator";
import { VisibilitySelector } from "./VisibilitySelector";
import { StepPropertiesContent } from "./StepPropertiesContent";
import type { NexflowStep } from "@/types/nexflow";
import type { StepDraft } from "@/hooks/useFlowBuilderState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface PropertiesPanelProps {
  flowDraft: FlowDraft;
  onFlowDraftChange: (updates: Partial<FlowDraft>) => void;
  selectedField: NexflowStepField | null;
  activeStep: NexflowStep | null;
  stepDraft: StepDraft | null;
  onFieldUpdate: (input: UpdateStepFieldInput) => void | Promise<void>;
  onFieldConfigurationUpdate: (
    fieldId: string,
    configuration: StepFieldConfiguration
  ) => void | Promise<void>;
  onDuplicateField: (fieldId: string) => void | Promise<void>;
  onDeleteField: (fieldId: string) => void | Promise<void>;
  onStepUpdate?: (stepId: string, updates: { title?: string; color?: string }) => void | Promise<void>;
  onStepDraftChange: (updates: Partial<StepDraft>) => void;
}

export function PropertiesPanel({
  flowDraft,
  onFlowDraftChange,
  selectedField,
  activeStep,
  stepDraft,
  onFieldUpdate,
  onFieldConfigurationUpdate,
  onDuplicateField,
  onDeleteField,
  onStepUpdate,
  onStepDraftChange,
}: PropertiesPanelProps) {
  const generalForm = useForm<FlowDraft>({
    defaultValues: flowDraft,
  });

  useEffect(() => {
    generalForm.reset(flowDraft);
  }, [flowDraft, generalForm]);

  const fieldForm = useForm<FieldFormValues>({
    defaultValues: selectedField
      ? toFieldFormValues(selectedField)
      : {
          label: "",
          placeholder: "",
          isRequired: false,
          minLength: undefined,
          maxLength: undefined,
          validation: "none",
          checklistItems: [],
        },
  });

  useEffect(() => {
    if (selectedField) {
      fieldForm.reset(toFieldFormValues(selectedField));
    }
  }, [selectedField, fieldForm]);

  const commitConfiguration = () => {
    if (!selectedField) return;
    const configuration = buildConfigurationFromForm(
      fieldForm.getValues(),
      selectedField.fieldType
    );
    onFieldConfigurationUpdate(selectedField.id, configuration);
  };

  // Estado para controlar a aba ativa quando um step está selecionado
  const [activeTab, setActiveTab] = useState<"step" | "flow">("step");

  // Resetar para aba de step quando um novo step é selecionado
  useEffect(() => {
    if (activeStep) {
      setActiveTab("step");
    }
  }, [activeStep]);

  return (
    <aside className="h-[600px] max-h-[800px] rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
      <ScrollArea className="flex-1 min-h-0 w-full">
        <div className="p-5 pb-6" style={{ minWidth: "100%", display: "flex", flexDirection: "column" }}>
          {selectedField ? (
            <FieldPropertiesContent
              fieldForm={fieldForm}
              selectedField={selectedField}
              onFieldUpdate={onFieldUpdate}
              onDuplicateField={onDuplicateField}
              onDeleteField={onDeleteField}
              onCommitConfiguration={commitConfiguration}
            />
          ) : activeStep ? (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "step" | "flow")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-5 h-auto">
                <TabsTrigger value="step" className="text-[10px] px-2 py-1.5">Propriedades da Etapa</TabsTrigger>
                <TabsTrigger value="flow" className="text-[10px] px-2 py-1.5">Propriedades do Flow</TabsTrigger>
              </TabsList>
              <TabsContent value="step" className="mt-0">
                <StepPropertiesContent
                  step={activeStep}
                  stepDraft={stepDraft}
                  onStepUpdate={onStepUpdate}
                  onStepDraftChange={onStepDraftChange}
                />
              </TabsContent>
              <TabsContent value="flow" className="mt-0">
                <GeneralPropertiesContent
                  generalForm={generalForm}
                  onFlowDraftChange={onFlowDraftChange}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <GeneralPropertiesContent
              generalForm={generalForm}
              onFlowDraftChange={onFlowDraftChange}
            />
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

interface GeneralPropertiesContentProps {
  generalForm: UseFormReturn<FlowDraft>;
  onFlowDraftChange: (updates: Partial<FlowDraft>) => void;
}

function GeneralPropertiesContent({
  generalForm,
  onFlowDraftChange,
}: GeneralPropertiesContentProps) {
  const nameRegister = generalForm.register("name");
  const descriptionRegister = generalForm.register("description");

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-slate-900">
          Configurações gerais
        </p>
        <p className="text-xs text-slate-500">
          Ajuste informações do flow e defina a visibilidade padrão.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Nome do flow</Label>
          <Input
            {...nameRegister}
            onChange={(event) => {
              nameRegister.onChange(event);
              onFlowDraftChange({ name: event.target.value });
            }}
            onBlur={(event) => {
              nameRegister.onBlur(event);
              onFlowDraftChange({ name: event.target.value.trim() });
            }}
            placeholder="Ex: Onboarding de Clientes"
          />
        </div>
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea
            rows={4}
            {...descriptionRegister}
            onChange={(event) => {
              descriptionRegister.onChange(event);
              onFlowDraftChange({ description: event.target.value });
            }}
            onBlur={(event) => {
              descriptionRegister.onBlur(event);
              onFlowDraftChange({ description: event.target.value });
            }}
            placeholder="Explique rapidamente o objetivo deste fluxo."
          />
        </div>
        {/* Visibility Selector */}
        <VisibilitySelector
          value={{
            visibilityType: (generalForm.watch("visibilityType") as "company" | "team" | "user") || "company",
            visibleTeamIds: Array.isArray(generalForm.watch("visibleTeamIds")) 
              ? generalForm.watch("visibleTeamIds") 
              : [],
            excludedUserIds: Array.isArray(generalForm.watch("excludedUserIds")) 
              ? generalForm.watch("excludedUserIds") 
              : [],
          }}
          onChange={(config) => {
            generalForm.setValue("visibilityType", config.visibilityType, { shouldDirty: true });
            generalForm.setValue("visibleTeamIds", Array.isArray(config.visibleTeamIds) ? config.visibleTeamIds : [], { shouldDirty: true });
            generalForm.setValue("excludedUserIds", Array.isArray(config.excludedUserIds) ? config.excludedUserIds : [], { shouldDirty: true });
            onFlowDraftChange(config);
          }}
        />
      </div>
    </div>
  );
}

interface FieldPropertiesContentProps {
  fieldForm: UseFormReturn<FieldFormValues>;
  selectedField: NexflowStepField;
  onFieldUpdate: (input: UpdateStepFieldInput) => void | Promise<void>;
  onCommitConfiguration: () => void;
  onDuplicateField: (fieldId: string) => void | Promise<void>;
  onDeleteField: (fieldId: string) => void | Promise<void>;
}

function FieldPropertiesContent({
  fieldForm,
  selectedField,
  onFieldUpdate,
  onCommitConfiguration,
  onDuplicateField,
  onDeleteField,
}: FieldPropertiesContentProps) {
  const labelRegister = fieldForm.register("label");
  const placeholderRegister = fieldForm.register("placeholder");

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Campo selecionado
          </p>
          <h2 className="text-xl font-bold text-slate-900">
            {selectedField.label}
          </h2>
          <p className="text-xs capitalize text-slate-500">
            {selectedField.fieldType.replace("_", " ")}
          </p>
        </div>
        <div className="flex gap-2 justify-center items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicateField(selectedField.id)}
          >
            Duplicar
          </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeleteField(selectedField.id)}
            >
              Remover
            </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Título do campo</Label>
          <Input
            {...labelRegister}
            onChange={(event) => {
              labelRegister.onChange(event);
              fieldForm.setValue("label", event.target.value);
            }}
            onBlur={(event) => {
              labelRegister.onBlur(event);
              onFieldUpdate({
                id: selectedField.id,
                label: event.target.value.trim() || "Campo sem título",
              });
            }}
            placeholder="Ex: Número do contrato"
          />
        </div>

        <div className="space-y-2">
          <Label>Placeholder</Label>
          <Input
            {...placeholderRegister}
            onBlur={(event) => {
              placeholderRegister.onBlur(event);
              fieldForm.setValue("placeholder", event.target.value);
              onCommitConfiguration();
            }}
            placeholder="Texto auxiliar exibido no campo"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
          <div>
            <Label className="text-sm font-semibold text-slate-900">
              Obrigatório
            </Label>
            <p className="text-xs text-slate-500">
              Impede o avanço caso o campo esteja vazio.
            </p>
          </div>
          <Controller
            control={fieldForm.control}
            name="isRequired"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(value) => {
                  field.onChange(value);
                  onFieldUpdate({
                    id: selectedField.id,
                    isRequired: value,
                  });
                }}
              />
            )}
          />
        </div>
      </div>

      <FieldConfigRenderer
        fieldType={selectedField.fieldType}
        control={fieldForm.control}
        register={fieldForm.register}
        getValues={fieldForm.getValues}
        setValue={fieldForm.setValue}
        onCommit={onCommitConfiguration}
      />
    </div>
  );
}


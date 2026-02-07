import { useWatch } from "react-hook-form";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AgentsMultiSelect } from "@/components/crm/flows/AgentsMultiSelect";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCnpjCpf, validateCnpjCpf } from "@/lib/utils/cnpjCpf";
import { isSystemField, SYSTEM_FIELDS } from "@/lib/flowBuilder/systemFields";
import { useUsers } from "@/hooks/useUsers";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { cn } from "@/lib/utils";
import type { UseFormReturn } from "react-hook-form";
import type { NexflowStepField } from "@/types/nexflow";
import type { CardFormValues } from "../types";

interface CardFormFieldsProps {
  fields: NexflowStepField[];
  form: UseFormReturn<CardFormValues>;
  isDisabled: boolean;
  onCheckboxChange: (fieldId: string, item: string, checked: boolean) => void;
  onDateChange: (fieldId: string, date: Date | undefined) => void;
}

export function CardFormFields({
  fields,
  form,
  isDisabled,
  onCheckboxChange,
  onDateChange,
}: CardFormFieldsProps) {
  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useOrganizationTeams();
  const watchFields = useWatch({ control: form.control, name: "fields" });
  const watchChecklist = useWatch({ control: form.control, name: "checklist" });
  const watchAssignedTo = useWatch({ control: form.control, name: "assignedTo" });
  const watchAssignedTeamId = useWatch({ control: form.control, name: "assignedTeamId" });
  const watchAgents = useWatch({ control: form.control, name: "agents" });

  const renderField = (field: NexflowStepField) => {
    const isAgentsField = 
      field.slug === SYSTEM_FIELDS.AGENTS ||
      (field.fieldType === "user_select" && 
       field.label.toLowerCase().includes("agents")) ||
      (field.fieldType === "user_select" && 
       field.label.toLowerCase().includes("agentes"));
    
    if (isAgentsField) {
      return (
        <div>
          <Label className="block text-sm font-semibold text-gray-700  mb-2">
            {field.label}
            {field.isRequired && (
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </Label>
          <AgentsMultiSelect
            value={watchAgents ?? []}
            onChange={(agentIds) => {
              form.setValue("agents", agentIds, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            placeholder="Selecione os responsáveis"
          />
        </div>
      );
    }
    
    const isAssignedToField = 
      field.fieldType === "user_select" && 
      field.slug !== SYSTEM_FIELDS.AGENTS &&
      field.slug !== SYSTEM_FIELDS.ASSIGNED_TEAM_ID &&
      !field.label.toLowerCase().includes("agents") &&
      !field.label.toLowerCase().includes("agentes") &&
      (field.slug === SYSTEM_FIELDS.ASSIGNED_TO ||
       (field.label.toLowerCase().includes("responsável") && field.slug !== SYSTEM_FIELDS.ASSIGNED_TEAM_ID));
    
    if (isAssignedToField) {
      const activeUsers = users.filter((user) => user.is_active);
      const selectedUser = watchAssignedTo 
        ? activeUsers.find((user) => user.id === watchAssignedTo)
        : null;
      
      return (
        <div>
          <Label className="block text-sm font-semibold text-gray-700  mb-2">
            {field.label}
            {field.isRequired && (
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </Label>
          <div className="relative">
            <Select
              value={watchAssignedTo ?? undefined}
              onValueChange={(value) => {
                if (!isDisabled) {
                  const newValue = value && value.trim() ? value : null;
                  form.setValue("assignedTo", newValue, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
              disabled={isDisabled}
            >
              <SelectTrigger className="block w-full appearance-none rounded-lg border-gray-300   text-gray-900  focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 pl-4 pr-10 disabled:opacity-50 disabled:cursor-not-allowed">
                <SelectValue placeholder="Selecione um usuário">
                  {selectedUser ? `${selectedUser.name} ${selectedUser.surname}` : "Selecione um usuário"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {activeUsers.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    Nenhum usuário disponível
                  </div>
                ) : (
                  activeUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} {user.surname}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>
        </div>
      );
    }
    
    const fieldLabelLower = field.label.toLowerCase();
    const isTeamField = 
      field.fieldType === "user_select" && 
      field.slug !== SYSTEM_FIELDS.AGENTS &&
      field.slug !== SYSTEM_FIELDS.ASSIGNED_TO &&
      !fieldLabelLower.includes("agents") &&
      !fieldLabelLower.includes("agentes") &&
      !fieldLabelLower.includes("responsável") &&
      (field.slug === SYSTEM_FIELDS.ASSIGNED_TEAM_ID ||
       fieldLabelLower === "time" ||
       (fieldLabelLower.includes("time") && !fieldLabelLower.includes("responsável")));
    
    if (isTeamField) {
      const activeTeams = teams.filter((team) => team.is_active);
      const selectedTeam = watchAssignedTeamId
        ? activeTeams.find((team) => team.id === watchAssignedTeamId)
        : null;
      
      return (
        <div>
          <Label className="block text-sm font-semibold text-gray-700  mb-2">
            {field.label}
            {field.isRequired && (
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </Label>
          <div className="relative">
            <Select
              value={watchAssignedTeamId ?? undefined}
              onValueChange={(value) => {
                if (!isDisabled) {
                  const newValue = value && value.trim() ? value : null;
                  form.setValue("assignedTeamId", newValue, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
              disabled={isDisabled}
            >
              <SelectTrigger className="block w-full appearance-none rounded-lg border-gray-300   text-gray-900  focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 pl-4 pr-10 disabled:opacity-50 disabled:cursor-not-allowed">
                <SelectValue placeholder="Selecione um time">
                  {selectedTeam ? selectedTeam.name : "Selecione um time"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {activeTeams.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    Nenhum time disponível
                  </div>
                ) : (
                  activeTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>
        </div>
      );
    }
    
    if (field.fieldType === "checklist") {
      const items = field.configuration.items ?? [];
      return (
        <div>
          <Label className="block text-sm font-semibold text-gray-700  mb-2">
            {field.label}
            {field.isRequired && (
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </Label>
          {items.length === 0 ? (
            <p className="text-xs text-gray-400">Sem itens configurados.</p>
          ) : (
            <div className="space-y-2 rounded-xl bg-gray-50  p-3">
              {items.map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700  transition-colors hover:text-gray-900 :text-white"
                >
                  <Checkbox
                    checked={watchChecklist?.[field.id]?.[item] === true}
                    onCheckedChange={(checked) => {
                      if (!isDisabled) {
                        onCheckboxChange(field.id, item, checked === true);
                      }
                    }}
                    disabled={isDisabled}
                  />
                  {item}
                </label>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (field.fieldType === "date") {
      const value = watchFields[field.id];
      const parsedValue =
        value && typeof value === "string" && !Number.isNaN(new Date(value).getTime())
          ? new Date(value)
          : undefined;

      return (
        <div>
          <Label className="block text-sm font-semibold text-gray-700  mb-2">
            {field.label}
            {field.isRequired && (
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </Label>
          <div className="relative rounded-md shadow-sm group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="text-gray-400 group-focus-within:text-blue-600 transition-colors text-lg" />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "block w-full rounded-lg border-gray-300   text-gray-900  placeholder-gray-400 focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 pl-10 pr-4 transition-shadow text-left font-normal",
                    !parsedValue && "text-gray-400"
                  )}
                >
                  {parsedValue ? format(parsedValue, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parsedValue}
                  onSelect={(date) => {
                    if (!isDisabled) {
                      onDateChange(field.id, date);
                    }
                  }}
                  initialFocus
                  disabled={isDisabled}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      );
    }

    if (field.configuration.variant === "long") {
      return (
        <div>
          <Label className="block text-sm font-semibold text-gray-700  mb-2">
            {field.label}
            {field.isRequired && (
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </Label>
          <div className="relative rounded-md shadow-sm">
            <Textarea
              rows={4}
              placeholder={(field.configuration.placeholder as string) ?? "Digite sua resposta..."}
              className="block w-full rounded-lg border-gray-300   text-gray-900  placeholder-gray-400 focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 px-4 transition-shadow resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              {...form.register(`fields.${field.id}`)}
              disabled={isDisabled}
            />
          </div>
        </div>
      );
    }

    if (field.configuration.validation === "cnpj_cpf") {
      const cnpjCpfType = (field.configuration.cnpjCpfType as "auto" | "cpf" | "cnpj") ?? "auto";
      return (
        <div>
          <Label className="block text-sm font-semibold text-gray-700  mb-2">
            {field.label}
            {field.isRequired && (
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </Label>
          <div className="relative rounded-md shadow-sm">
            <Input
              placeholder={(field.configuration.placeholder as string) ?? "000.000.000-00 ou 00.000.000/0000-00"}
              value={formatCnpjCpf((watchFields[field.id] as string) ?? "", cnpjCpfType)}
              onChange={(e) => {
                if (!isDisabled) {
                  const formatted = formatCnpjCpf(e.target.value, cnpjCpfType);
                  form.setValue(`fields.${field.id}`, formatted, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
              onBlur={() => {
                if (!isDisabled) {
                  const value = (watchFields[field.id] as string) ?? "";
                  if (value && !validateCnpjCpf(value, cnpjCpfType)) {
                    form.setError(`fields.${field.id}`, {
                      type: "manual",
                      message: "CPF/CNPJ inválido",
                    });
                  } else {
                    form.clearErrors(`fields.${field.id}`);
                  }
                }
              }}
              className="block w-full rounded-lg border-gray-300   text-gray-900  placeholder-gray-400 focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 px-4 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDisabled}
            />
          </div>
          {form.formState.errors.fields?.[field.id] && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.fields?.[field.id]?.message as string}
            </p>
          )}
        </div>
      );
    }

    return (
      <div>
        <Label className="block text-sm font-semibold text-gray-700  mb-2">
          {field.label}
          {field.isRequired && (
            <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
              Obrigatório
            </span>
          )}
        </Label>
        <div className="relative rounded-md shadow-sm">
          <Input
            type={field.fieldType === "number" ? "number" : "text"}
            placeholder={(field.configuration.placeholder as string) ?? ""}
            className="block w-full rounded-lg border-gray-300   text-gray-900  placeholder-gray-400 focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 px-4 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            {...form.register(`fields.${field.id}`)}
            disabled={isDisabled}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <div key={field.id}>{renderField(field)}</div>
      ))}
    </div>
  );
}


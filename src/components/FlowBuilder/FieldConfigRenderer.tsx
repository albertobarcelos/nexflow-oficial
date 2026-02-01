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
import type {
  Control,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import type { StepFieldType } from "@/types/nexflow";
import type { FieldFormValues } from "./types";

interface FieldConfigRendererProps {
  fieldType: StepFieldType;
  control: Control<FieldFormValues>;
  register: UseFormRegister<FieldFormValues>;
  getValues: UseFormGetValues<FieldFormValues>;
  setValue: UseFormSetValue<FieldFormValues>;
  onCommit: () => void;
}

export function FieldConfigRenderer({
  fieldType,
  control,
  register,
  getValues,
  setValue,
  onCommit,
}: FieldConfigRendererProps) {
  if (fieldType === "text") {
    return (
      <div className="space-y-4 rounded-xl border border-neutral-200 p-4">
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            Validações de texto
          </p>
          <p className="text-xs text-neutral-500">
            Defina limites e validações para evitar erros de preenchimento.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Min. de caracteres</Label>
            <Input
              type="number"
              placeholder="0"
              {...register("minLength", { valueAsNumber: true })}
              onBlur={(event) => {
                const value = event.target.value;
                setValue(
                  "minLength",
                  value === "" ? undefined : Number(value),
                  { shouldDirty: true }
                );
                onCommit();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Máx. de caracteres</Label>
            <Input
              type="number"
              placeholder="255"
              {...register("maxLength", { valueAsNumber: true })}
              onBlur={(event) => {
                const value = event.target.value;
                setValue(
                  "maxLength",
                  value === "" ? undefined : Number(value),
                  { shouldDirty: true }
                );
                onCommit();
              }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Validação</Label>
          <Select
            value={getValues("validation") ?? "none"}
            onValueChange={(value) => {
              setValue("validation", value as FieldFormValues["validation"], {
                shouldDirty: true,
              });
              // Resetar cnpjCpfType se mudar de cnpj_cpf para outra validação
              if (value !== "cnpj_cpf") {
                setValue("cnpjCpfType", undefined, { shouldDirty: true });
              } else {
                // Definir padrão como "auto" se selecionar cnpj_cpf
                setValue("cnpjCpfType", "auto", { shouldDirty: true });
              }
              onCommit();
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem validação</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Telefone</SelectItem>
              <SelectItem value="cnpj_cpf">CNPJ/CPF</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {getValues("validation") === "cnpj_cpf" && (
          <div className="space-y-2">
            <Label>Tipo de validação</Label>
            <Select
              value={getValues("cnpjCpfType") ?? "auto"}
              onValueChange={(value) => {
                setValue("cnpjCpfType", value as "auto" | "cpf" | "cnpj", {
                  shouldDirty: true,
                });
                onCommit();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automático (CPF ou CNPJ)</SelectItem>
                <SelectItem value="cpf">Apenas CPF</SelectItem>
                <SelectItem value="cnpj">Apenas CNPJ</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-neutral-500">
              Automático detecta o tipo pela quantidade de dígitos. Selecione um tipo específico para validar apenas CPF ou apenas CNPJ.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (fieldType === "checklist") {
    const { fields, append, remove } = useFieldArray({
      control,
      name: "checklistItems",
    });

    return (
      <div className="space-y-4 rounded-xl border border-neutral-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              Itens do checklist
            </p>
            <p className="text-xs text-neutral-500">
              Organize as opções que precisarão ser marcadas.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              append({ value: "" });
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>

        <div className="space-y-3">
          {fields.length === 0 && (
            <p className="text-xs text-neutral-400">
              Nenhuma opção cadastrada. Clique em adicionar para começar.
            </p>
          )}
          {fields.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <Input
                placeholder={`Opção ${index + 1}`}
                {...register(`checklistItems.${index}.value` as const)}
                onBlur={() => onCommit()}
              />
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Remover opção ${index + 1}`}
                onClick={() => {
                  remove(index);
                  onCommit();
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}


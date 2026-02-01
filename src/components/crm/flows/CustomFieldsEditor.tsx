import { useState } from "react";
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
import { X, TextFields, Hash, Calendar, CheckSquare, File, User } from "lucide-react";
import { NexflowStepField, StepFieldType, StepType } from "@/types/nexflow";

interface CustomField {
  id: string;
  label: string;
  fieldType: StepFieldType;
}

interface CustomFieldsEditorProps {
  fields: NexflowStepField[];
  onAddField: (field: Omit<NexflowStepField, "id" | "createdAt">) => void;
  onRemoveField: (fieldId: string) => void;
  stepType?: StepType;
}

export function CustomFieldsEditor({
  fields,
  onAddField,
  onRemoveField,
  stepType = "standard",
}: CustomFieldsEditorProps) {
  const canEditFields = stepType === "standard";
  const [isAdding, setIsAdding] = useState(false);
  const [newField, setNewField] = useState({
    label: "",
    fieldType: "text" as StepFieldType,
  });

  const getFieldIcon = (fieldType: StepFieldType) => {
    const icons: Record<StepFieldType, React.ReactNode> = {
      text: <TextFields className="h-4 w-4" />,
      number: <Hash className="h-4 w-4" />,
      date: <Calendar className="h-4 w-4" />,
      checklist: <CheckSquare className="h-4 w-4" />,
      file: <File className="h-4 w-4" />,
      user_select: <User className="h-4 w-4" />,
    };
    return icons[fieldType] || <TextFields className="h-4 w-4" />;
  };

  const handleAddField = () => {
    if (!newField.label.trim()) return;

    onAddField({
      stepId: "", // Será preenchido pelo componente pai
      label: newField.label,
      fieldType: newField.fieldType,
      isRequired: false,
      position: fields.length,
      configuration: {},
    });

    setNewField({ label: "", fieldType: "text" });
    setIsAdding(false);
  };

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Custom Fields
        </h3>
        {canEditFields ? (
          <button
            className="text-xs text-primary hover:text-primary-dark font-medium flex items-center"
            onClick={() => setIsAdding(true)}
          >
            <span className="material-icons-outlined text-sm mr-1">add</span> Add
          </button>
        ) : (
          <p className="text-xs text-neutral-500">
            Campos não podem ser adicionados neste tipo de etapa
          </p>
        )}
      </div>

      {isAdding && (
        <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-neutral-600 dark:text-neutral-400">
                Field Label
              </Label>
              <Input
                value={newField.label}
                onChange={(e) =>
                  setNewField({ ...newField, label: e.target.value })
                }
                placeholder="Enter field name..."
                className="mt-1 text-sm"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs text-neutral-600 dark:text-neutral-400">
                Field Type
              </Label>
              <Select
                value={newField.fieldType}
                onValueChange={(value) =>
                  setNewField({ ...newField, fieldType: value as StepFieldType })
                }
              >
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Input</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="checklist">Checklist</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="user_select">User Select</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddField}
                disabled={!newField.label.trim()}
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewField({ label: "", fieldType: "text" });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {fields.length === 0 ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center py-4">
            No custom fields added yet
          </p>
        ) : (
          fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 group"
            >
              <span className="text-neutral-400 text-sm">
                {getFieldIcon(field.fieldType)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  {field.label}
                </p>
                <p className="text-[10px] text-neutral-500">
                  {field.fieldType === "text" && "Text Input"}
                  {field.fieldType === "number" && "Number"}
                  {field.fieldType === "date" && "Date"}
                  {field.fieldType === "checklist" && "Checklist"}
                  {field.fieldType === "file" && "File"}
                  {field.fieldType === "user_select" && "User Select"}
                </p>
              </div>
              {canEditFields && (
                <button
                  className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveField(field.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}


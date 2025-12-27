import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { NexflowStepAction, ActionType } from "@/types/nexflow";
import { useStepActions } from "@/hooks/useStepActions";
import { Bold, Italic, List, Code } from "lucide-react";
import { ChecklistEditor } from "./ChecklistEditor";

interface StepActionFormProps {
  stepId: string;
  action: NexflowStepAction | null;
  onSave: () => void;
}

export function StepActionForm({ stepId, action, onSave }: StepActionFormProps) {
  const { updateStepAction, createStepAction } = useStepActions(stepId);
  const [formData, setFormData] = useState({
    title: "",
    dayOffset: 1,
    actionType: "task" as ActionType,
    description: "",
    scriptTemplate: "",
    checklistItems: [] as string[],
    isRequired: true,
    allowNotes: true,
    requiredCompletion: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (action) {
      setFormData({
        title: action.title,
        dayOffset: action.dayOffset,
        actionType: action.actionType,
        description: action.description || "",
        scriptTemplate: action.scriptTemplate || "",
        checklistItems: action.checklistItems || [],
        isRequired: action.isRequired,
        allowNotes: action.settings.allowNotes ?? true,
        requiredCompletion: action.settings.requiredCompletion ?? true,
      });
    } else {
      setFormData({
        title: "",
        dayOffset: 1,
        actionType: "task",
        description: "",
        scriptTemplate: "",
        checklistItems: [],
        isRequired: true,
        allowNotes: true,
        requiredCompletion: true,
      });
    }
  }, [action]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      if (action) {
        await updateStepAction({
          id: action.id,
          title: formData.title,
          dayOffset: formData.dayOffset,
          actionType: formData.actionType,
          description: formData.description || undefined,
          scriptTemplate: formData.scriptTemplate || undefined,
          checklistItems: formData.checklistItems,
          isRequired: formData.isRequired,
          settings: {
            allowNotes: formData.allowNotes,
            requiredCompletion: formData.requiredCompletion,
          },
        });
      } else {
        await createStepAction({
          stepId,
          title: formData.title,
          dayOffset: formData.dayOffset,
          actionType: formData.actionType,
          description: formData.description || undefined,
          scriptTemplate: formData.scriptTemplate || undefined,
          checklistItems: formData.checklistItems,
          isRequired: formData.isRequired,
          settings: {
            allowNotes: formData.allowNotes,
            requiredCompletion: formData.requiredCompletion,
          },
        });
      }
      onSave();
    } catch (error) {
      console.error("Erro ao salvar ação:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const requiresScriptTemplate =
    formData.actionType === "phone_call" ||
    formData.actionType === "linkedin_message" ||
    formData.actionType === "whatsapp" ||
    formData.actionType === "email";

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector(
      'textarea[name="scriptTemplate"]'
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = `${before}{{${variable}}}${after}`;
      setFormData({ ...formData, scriptTemplate: newText });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + variable.length + 4,
          start + variable.length + 4
        );
      }, 0);
    }
  };

  if (!action && !formData.title) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900 relative">
        <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">
              Selecione uma ação da lista ou crie uma nova
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900 relative">
      <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Step Configuration
          </h2>
          {action && (
            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              ID: {action.id.substring(0, 8).toUpperCase()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Básicas */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1 md:col-span-2">
                  <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Step Title
                  </Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter step title..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Scheduled Day
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={formData.dayOffset}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dayOffset: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm"
                      placeholder="1"
                    />
                    <span className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                      dia(s)
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Action Type
                  </Label>
                  <Select
                    value={formData.actionType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        actionType: value as ActionType,
                      })
                    }
                  >
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone_call">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="linkedin_message">LinkedIn Message</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="task">General Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.actionType === "email" && (
                  <div className="col-span-1 md:col-span-2">
                    <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Subject
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Enter email subject..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Script Template */}
            {requiresScriptTemplate && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col overflow-hidden min-h-[400px]">
                <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mr-2">
                    Script Template
                  </span>
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                  <button
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title="List"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                  <button
                    className="flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-primary text-xs font-medium rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                    onClick={() => {
                      const vars = ["contact_name", "agent_name", "company_name"];
                      // Por enquanto, inserir o primeiro
                      insertVariable(vars[0]);
                    }}
                  >
                    <Code className="h-3 w-3" />
                    Insert Variable
                  </button>
                </div>
                <div className="flex-1 p-4">
                  <Textarea
                    name="scriptTemplate"
                    value={formData.scriptTemplate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scriptTemplate: e.target.value,
                      })
                    }
                    placeholder="Type your script or guidelines here..."
                    className="w-full h-full resize-none border-none bg-transparent focus:ring-0 text-slate-700 dark:text-slate-300 text-sm leading-relaxed min-h-[300px]"
                  />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 px-4 py-2 text-xs text-slate-500 flex justify-between">
                  <span>Markdown supported</span>
                  <span>
                    {formData.scriptTemplate.split(/\s+/).filter(Boolean).length}{" "}
                    words
                  </span>
                </div>
              </div>
            )}
          </div>

            {/* Sidebar Options */}
          <div className="space-y-6">
            {/* Step Options */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Step Options
              </h3>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">
                  Allow Notes
                </span>
                <Switch
                  checked={formData.allowNotes}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allowNotes: checked })
                  }
                />
              </label>
              <div className="h-px bg-slate-100 dark:bg-slate-700"></div>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">
                  Required Completion
                </span>
                <Switch
                  checked={formData.requiredCompletion}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requiredCompletion: checked })
                  }
                />
              </label>
            </div>

            {/* To-Do Checklist */}
            <ChecklistEditor
              items={formData.checklistItems}
              onChange={(items) =>
                setFormData({ ...formData, checklistItems: items })
              }
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 flex justify-end gap-3 z-10">
          <Button
            variant="outline"
            onClick={() => {
              setFormData({
                title: "",
                dayOffset: 1,
                actionType: "task",
                description: "",
                scriptTemplate: "",
                checklistItems: [],
                isRequired: true,
                allowNotes: true,
                requiredCompletion: true,
              });
            }}
          >
            Discard
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !formData.title.trim()}>
            {isSaving ? "Saving..." : "Save Process"}
          </Button>
        </div>
      </div>
    </div>
  );
}


import { useMemo } from "react";
import { useNexflowUsers } from "@/hooks/useNexflowUsers";
import { useNexflowSteps } from "@/hooks/useNexflowSteps";
import {
  useNexflowFlowAccess,
  useNexflowStepVisibility,
  useRemoveNexflowFlowAccess,
  useSaveNexflowFlowAccess,
  useSaveNexflowStepVisibility,
} from "@/hooks/useNexflowPermissions";
import { FlowAccessRole } from "@/types/nexflow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface FlowPermissionsTabProps {
  flowId: string;
}

export function FlowPermissionsTab({ flowId }: FlowPermissionsTabProps) {
  const { data: users = [], isLoading: isLoadingUsers } = useNexflowUsers();
  const { steps, isLoading: isLoadingSteps } = useNexflowSteps(flowId);
  const {
    data: accessList = [],
    isLoading: isLoadingAccess,
  } = useNexflowFlowAccess(flowId);
  const {
    data: visibilityList = [],
    isLoading: isLoadingVisibility,
  } = useNexflowStepVisibility(flowId);

  const saveAccess = useSaveNexflowFlowAccess(flowId);
  const removeAccess = useRemoveNexflowFlowAccess(flowId);
  const saveVisibility = useSaveNexflowStepVisibility(flowId);

  const accessMap = useMemo(() => {
    return accessList.reduce<Record<string, FlowAccessRole>>((acc, item) => {
      acc[item.userId] = item.role;
      return acc;
    }, {});
  }, [accessList]);

  const visibilityMap = useMemo(() => {
    return visibilityList.reduce<Record<string, boolean>>((acc, entry) => {
      acc[`${entry.userId}-${entry.stepId}`] = entry.canView;
      return acc;
    }, {});
  }, [visibilityList]);

  const isLoadingMatrix =
    isLoadingUsers || isLoadingSteps || isLoadingAccess || isLoadingVisibility;

  const handleChangeRole = (userId: string, value: string) => {
    if (value === "none") {
      if (accessMap[userId]) {
        removeAccess.mutate(userId);
      }
      return;
    }
    saveAccess.mutate({ userId, role: value as FlowAccessRole });
  };

  const handleToggleVisibility = (userId: string, stepId: string, checked: boolean) => {
    saveVisibility.mutate({
      updates: [
        {
          userId,
          stepId,
          canView: checked,
        },
      ],
    });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Permissões globais</h2>
          <p className="text-sm text-muted-foreground">
            Defina quem pode visualizar ou editar todo o flow.
          </p>
        </div>

        {isLoadingMatrix ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border">
            <div className="grid grid-cols-[2fr,1fr,100px] gap-4 border-b bg-muted/40 px-4 py-3 text-sm font-medium text-muted-foreground">
              <span>Usuário</span>
              <span>Permissão</span>
              <span>Ações</span>
            </div>
            <div className="divide-y">
              {users.map((user) => {
                const currentRole = accessMap[user.id] ?? "none";
                return (
                  <div
                    key={user.id}
                    className="grid grid-cols-[2fr,1fr,100px] items-center gap-4 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Select
                      value={currentRole}
                      onValueChange={(value) => handleChangeRole(user.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem acesso</SelectItem>
                        <SelectItem value="viewer">Leitor</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex justify-end">
                      {currentRole !== "none" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAccess.mutate(user.id)}
                        >
                          Remover
                        </Button>
                      ) : (
                        <Badge variant="outline">Sem acesso</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Visibilidade por etapa</h2>
          <p className="text-sm text-muted-foreground">
            Controle quais etapas cada usuário consegue visualizar.
          </p>
        </div>

        <ScrollArea className="w-full">
          <div className="min-w-[600px] rounded-xl border">
            <div className="grid grid-cols-[180px_repeat(auto-fit,minmax(120px,1fr))] bg-muted/40">
              <div className="border-r px-4 py-3 text-sm font-medium text-muted-foreground">
                Usuários
              </div>
              <div className="col-span-full flex">
                {isLoadingSteps ? (
                  <div className="flex flex-1 gap-3 px-4 py-3">
                    {[1, 2, 3].map((item) => (
                      <Skeleton key={item} className="h-6 w-full" />
                    ))}
                  </div>
                ) : (
                  steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex-1 border-l px-4 py-3 text-center text-sm font-medium text-muted-foreground"
                    >
                      {step.title}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="divide-y">
              {users.map((user) => (
                <div
                  key={`matrix-${user.id}`}
                  className="grid grid-cols-[180px_repeat(auto-fit,minmax(120px,1fr))]"
                >
                  <div className="border-r px-4 py-3 text-sm font-medium">
                    <p>{user.firstName || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  {steps.map((step) => {
                    const key = `${user.id}-${step.id}`;
                    const isChecked =
                      visibilityMap[key] ?? true;

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-center border-l px-4 py-3"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            handleToggleVisibility(
                              user.id,
                              step.id,
                              checked === true
                            )
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </section>
    </div>
  );
}


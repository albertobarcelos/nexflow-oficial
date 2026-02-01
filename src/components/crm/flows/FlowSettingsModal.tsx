import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowPermissionsPanel } from "./FlowPermissionsModal";
import { useNexflowFlows } from "@/hooks/useNexflowFlows";
import type { NexflowFlow } from "@/types/nexflow";

interface FlowSettingsModalProps {
  flow: NexflowFlow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FlowFormValues {
  name: string;
  description: string;
}

export function FlowSettingsModal({ flow, open, onOpenChange }: FlowSettingsModalProps) {
  const { updateFlow, isUpdating } = useNexflowFlows();
  const form = useForm<FlowFormValues>({
    defaultValues: {
      name: flow?.name ?? "",
      description: flow?.description ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      name: flow?.name ?? "",
      description: flow?.description ?? "",
    });
  }, [flow?.id, flow?.name, flow?.description, form, open]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!flow) return;

    await updateFlow({
      id: flow.id,
      name: values.name.trim(),
      description: values.description.trim() || null,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configurações do Flow</DialogTitle>
          <DialogDescription>
            Configure as informações gerais e permissões de acesso deste flow
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="permissions" disabled={!flow}>
              Permissões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="flow-name">Nome do Flow</Label>
                <Input
                  id="flow-name"
                  placeholder="Ex: Onboarding Financeiro"
                  {...form.register("name", { required: true })}
                  disabled={isUpdating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flow-description">Descrição</Label>
                <Textarea
                  id="flow-description"
                  rows={4}
                  placeholder="Descreva rapidamente como este processo funciona."
                  {...form.register("description")}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="permissions" className="mt-4">
            {flow && <FlowPermissionsPanel flowId={flow.id} flowName={flow.name} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}


import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FlowCategory } from "@/types/nexflow";
import { useNexflowFlows } from "@/hooks/useNexflowFlows";
import { toast } from "sonner";

const CATEGORY_OPTIONS: { value: FlowCategory; label: string; helper: string }[] =
  [
    {
      value: "finance",
      label: "Financeiro (Simples)",
      helper: "Ideal para aprovações e checklists lineares.",
    },
    {
      value: "onboarding",
      label: "Onboarding (Modular)",
      helper: "Estilo Pipefy, com múltiplas etapas configuráveis.",
    },
    {
      value: "generic",
      label: "Genérico (Personalizado)",
      helper: "Use para outros tipos de processo interno.",
    },
  ];

export function NewNexflowPage() {
  const navigate = useNavigate();
  const { createFlow, isCreating } = useNexflowFlows();

  const [flowName, setFlowName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FlowCategory>("onboarding");

  const selectedCategory = useMemo(
    () => CATEGORY_OPTIONS.find((option) => option.value === category),
    [category]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!flowName.trim()) {
      toast.error("Informe um nome para o flow.");
      return;
    }

    try {
      const newFlow = await createFlow({
        name: flowName.trim(),
        description: description.trim() || undefined,
        category,
      });

      navigate(`/crm/flows/${newFlow.id}/builder`);
    } catch (error) {
      console.error("Erro ao criar flow:", error);
      toast.error("Não foi possível criar o flow. Tente novamente.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Novo Flow Nexflow</h1>
        <p className="text-muted-foreground">
          Configure o blueprint inicial escolhendo o tipo e as informações
          básicas. Você poderá detalhar etapas e permissões no próximo passo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="flow-name">Nome do Flow</Label>
              <Input
                id="flow-name"
                value={flowName}
                onChange={(event) => setFlowName(event.target.value)}
                placeholder="Ex: Onboarding Financeiro"
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flow-description">Descrição</Label>
              <Textarea
                id="flow-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Conte brevemente como este processo deve funcionar."
                disabled={isCreating}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as FlowCategory)}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <p className="text-xs text-muted-foreground">
                  {selectedCategory.helper}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isCreating}
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Criando..." : "Criar e Configurar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


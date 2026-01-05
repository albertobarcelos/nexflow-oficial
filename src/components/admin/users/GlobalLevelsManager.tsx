import { useState } from "react";
import { useGlobalTeamLevels, useCreateGlobalLevel, useUpdateGlobalLevel, useDeleteGlobalLevel } from "@/hooks/useGlobalTeamLevels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LevelFormData {
  name: string;
  level_order: number;
  commission_one_time_percentage: number;
  commission_recurring_percentage: number;
  promotion_criteria: string; // JSON string
  demotion_criteria: string; // JSON string
  description: string;
}

interface GlobalLevelsManagerProps {
  clientId: string; // OBRIGATÓRIO - client_id da empresa
}

export function GlobalLevelsManager({ clientId }: GlobalLevelsManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [levelToEdit, setLevelToEdit] = useState<string | null>(null);
  const [levelToDelete, setLevelToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<LevelFormData>({
    name: "",
    level_order: 1,
    commission_one_time_percentage: 0,
    commission_recurring_percentage: 0,
    promotion_criteria: "{}",
    demotion_criteria: "{}",
    description: "",
  });

  const { data: levels = [], isLoading } = useGlobalTeamLevels(clientId);
  const createLevel = useCreateGlobalLevel();
  const updateLevel = useUpdateGlobalLevel();
  const deleteLevel = useDeleteGlobalLevel();

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      level_order: (levels.length || 0) + 1,
      commission_one_time_percentage: 0,
      commission_recurring_percentage: 0,
      promotion_criteria: "{}",
      demotion_criteria: "{}",
      description: "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (levelId: string) => {
    const level = levels.find((l) => l.id === levelId);
    if (level) {
      setFormData({
        name: level.name,
        level_order: level.level_order,
        commission_one_time_percentage: level.commission_one_time_percentage || 0,
        commission_recurring_percentage: level.commission_recurring_percentage || 0,
        promotion_criteria: JSON.stringify(level.promotion_criteria || {}, null, 2),
        demotion_criteria: JSON.stringify(level.demotion_criteria || {}, null, 2),
        description: level.description || "",
      });
      setLevelToEdit(levelId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name.trim()) {
      toast.error("Nome do nível é obrigatório");
      return;
    }

    try {
      let promotionCriteria = {};
      let demotionCriteria = {};

      try {
        promotionCriteria = JSON.parse(formData.promotion_criteria);
      } catch {
        toast.error("Critérios de promoção inválidos (deve ser JSON válido)");
        return;
      }

      try {
        demotionCriteria = JSON.parse(formData.demotion_criteria);
      } catch {
        toast.error("Critérios de demissão inválidos (deve ser JSON válido)");
        return;
      }

      if (levelToEdit) {
        await updateLevel.mutateAsync({
          levelId: levelToEdit,
          input: {
            name: formData.name,
            level_order: formData.level_order,
            commission_one_time_percentage: formData.commission_one_time_percentage,
            commission_recurring_percentage: formData.commission_recurring_percentage,
            promotion_criteria: promotionCriteria,
            demotion_criteria: demotionCriteria,
            description: formData.description || null,
          },
        });
        setLevelToEdit(null);
      } else {
        if (!clientId) {
          toast.error("Erro: Cliente não identificado");
          return;
        }

        await createLevel.mutateAsync({
          name: formData.name,
          level_order: formData.level_order,
          commission_one_time_percentage: formData.commission_one_time_percentage,
          commission_recurring_percentage: formData.commission_recurring_percentage,
          promotion_criteria: promotionCriteria,
          demotion_criteria: demotionCriteria,
          description: formData.description || undefined,
          client_id: clientId, // OBRIGATÓRIO
        });
      }
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        level_order: 1,
        commission_one_time_percentage: 0,
        commission_recurring_percentage: 0,
        promotion_criteria: "{}",
        demotion_criteria: "{}",
        description: "",
      });
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleDelete = async () => {
    if (!levelToDelete) return;

    try {
      await deleteLevel.mutateAsync(levelToDelete);
      setLevelToDelete(null);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Carregando níveis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Níveis Globais</h3>
          <p className="text-sm text-muted-foreground">
            Configure os níveis hierárquicos e seus critérios de promoção/demissão
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Nível
        </Button>
      </div>

      {levels.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum nível configurado</p>
          <p className="text-sm">Clique em "Novo Nível" para começar</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Ordem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Implantação</TableHead>
                <TableHead className="text-right">Mensalidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels.map((level) => (
                <TableRow key={level.id}>
                  <TableCell className="font-medium">{level.level_order}</TableCell>
                  <TableCell className="font-medium">{level.name}</TableCell>
                  <TableCell className="text-right">
                    {level.commission_one_time_percentage?.toFixed(2) || "0.00"}%
                  </TableCell>
                  <TableCell className="text-right">
                    {level.commission_recurring_percentage?.toFixed(2) || "0.00"}%
                  </TableCell>
                  <TableCell>
                    <Badge variant={level.is_active ? "default" : "secondary"}>
                      {level.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(level.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLevelToDelete(level.id)}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog de Criar/Editar */}
      <Dialog
        open={isCreateDialogOpen || !!levelToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setLevelToEdit(null);
            setFormData({
              name: "",
              level_order: 1,
              commission_one_time_percentage: 0,
              commission_recurring_percentage: 0,
              promotion_criteria: "{}",
              demotion_criteria: "{}",
              description: "",
            });
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {levelToEdit ? "Editar Nível Global" : "Criar Novo Nível Global"}
            </DialogTitle>
            <DialogDescription>
              {levelToEdit 
                ? "Edite as informações do nível de time. Os percentuais de comissão serão aplicados aos times que utilizarem este nível."
                : "Configure um novo nível de time. Defina os percentuais de comissão para implantação e mensalidade."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Nível *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Nível 1, Líder, Sênior..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level_order">Ordem *</Label>
                <Input
                  id="level_order"
                  type="number"
                  min="1"
                  value={formData.level_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      level_order: parseInt(e.target.value) || 1,
                    })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  1 = nível mais alto
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commission_one_time">
                  % Comissão Implantação (one_time) *
                </Label>
                <Input
                  id="commission_one_time"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.commission_one_time_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commission_one_time_percentage:
                        parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission_recurring">
                  % Comissão Mensalidade (recurring) *
                </Label>
                <Input
                  id="commission_recurring"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.commission_recurring_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commission_recurring_percentage:
                        parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promotion_criteria">
                  Critérios de Promoção (JSON) *
                </Label>
                <Textarea
                  id="promotion_criteria"
                  value={formData.promotion_criteria}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      promotion_criteria: e.target.value,
                    })
                  }
                  placeholder='{"min_sales": 10, "min_revenue": 50000}'
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  JSON com critérios para subir de nível
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="demotion_criteria">
                  Critérios de Demissão (JSON) *
                </Label>
                <Textarea
                  id="demotion_criteria"
                  value={formData.demotion_criteria}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      demotion_criteria: e.target.value,
                    })
                  }
                  placeholder='{"max_sales": 5, "max_revenue": 20000}'
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  JSON com critérios para descer de nível
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição opcional do nível"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setLevelToEdit(null);
                }}
                disabled={createLevel.isPending || updateLevel.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createLevel.isPending || updateLevel.isPending}
              >
                {createLevel.isPending || updateLevel.isPending
                  ? "Salvando..."
                  : levelToEdit
                  ? "Salvar Alterações"
                  : "Criar Nível"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog
        open={!!levelToDelete}
        onOpenChange={(open) => {
          if (!open) setLevelToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este nível? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

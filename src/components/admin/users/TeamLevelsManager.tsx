import { useState } from "react";
import { useTeamLevels, useCreateTeamLevel, useUpdateTeamLevel, useDeleteTeamLevel, useReorderTeamLevels } from "@/hooks/useTeamLevels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
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

interface TeamLevelsManagerProps {
  teamId: string;
  teamName: string;
}

interface LevelFormData {
  name: string;
  level_order: number;
  commission_one_time_percentage: number;
  commission_recurring_percentage: number;
  description: string;
}

export function TeamLevelsManager({ teamId, teamName }: TeamLevelsManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [levelToEdit, setLevelToEdit] = useState<string | null>(null);
  const [levelToDelete, setLevelToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<LevelFormData>({
    name: "",
    level_order: 1,
    commission_one_time_percentage: 0,
    commission_recurring_percentage: 0,
    description: "",
  });

  const { data: levels = [], isLoading } = useTeamLevels(teamId);
  const createLevel = useCreateTeamLevel();
  const updateLevel = useUpdateTeamLevel();
  const deleteLevel = useDeleteTeamLevel();
  const reorderLevels = useReorderTeamLevels();

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      level_order: (levels.length || 0) + 1,
      commission_one_time_percentage: 0,
      commission_recurring_percentage: 0,
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

    if (formData.commission_one_time_percentage < 0 || formData.commission_one_time_percentage > 100) {
      toast.error("Percentual de implantação deve estar entre 0 e 100");
      return;
    }

    if (formData.commission_recurring_percentage < 0 || formData.commission_recurring_percentage > 100) {
      toast.error("Percentual de mensalidade deve estar entre 0 e 100");
      return;
    }

    try {
      if (levelToEdit) {
        await updateLevel.mutateAsync({
          levelId: levelToEdit,
          input: {
            name: formData.name,
            level_order: formData.level_order,
            commission_one_time_percentage: formData.commission_one_time_percentage,
            commission_recurring_percentage: formData.commission_recurring_percentage,
            description: formData.description || null,
          },
        });
        setLevelToEdit(null);
      } else {
        await createLevel.mutateAsync({
          team_id: teamId,
          name: formData.name,
          level_order: formData.level_order,
          commission_one_time_percentage: formData.commission_one_time_percentage,
          commission_recurring_percentage: formData.commission_recurring_percentage,
          description: formData.description || undefined,
        });
      }
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        level_order: 1,
        commission_one_time_percentage: 0,
        commission_recurring_percentage: 0,
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

  const handleReorder = async (levelId: string, direction: "up" | "down") => {
    const currentLevel = levels.find((l) => l.id === levelId);
    if (!currentLevel) return;

    const newOrder = direction === "up" ? currentLevel.level_order - 1 : currentLevel.level_order + 1;
    const targetLevel = levels.find((l) => l.level_order === newOrder);

    if (!targetLevel) {
      toast.error("Não é possível reordenar");
      return;
    }

    try {
      await reorderLevels.mutateAsync({
        teamId,
        levels: [
          { id: levelId, level_order: newOrder },
          { id: targetLevel.id, level_order: currentLevel.level_order },
        ],
      });
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
          <h3 className="text-lg font-semibold">Níveis do Time: {teamName}</h3>
          <p className="text-sm text-muted-foreground">
            Configure os níveis hierárquicos e seus percentuais de comissão
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
              {levels.map((level, index) => (
                <TableRow key={level.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleReorder(level.id, "up")}
                        disabled={index === 0}
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                      <span className="font-medium">{level.level_order}</span>
                    </div>
                  </TableCell>
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
              description: "",
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {levelToEdit ? "Editar Nível" : "Criar Novo Nível"}
            </DialogTitle>
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
                <p className="text-xs text-muted-foreground">
                  Percentual para itens com billing_type = one_time
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Percentual para itens com billing_type = recurring
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

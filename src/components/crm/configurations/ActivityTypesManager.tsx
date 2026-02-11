import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Pencil, Power, PowerOff } from "lucide-react";
import {
  useFlowActivityTypesByClient,
  useUpdateFlowActivityType,
} from "@/hooks/useFlowActivityTypes";
import type { FlowActivityTypeWithFlow } from "@/types/activities";
import { cn } from "@/lib/utils";

/** Ícones comuns para tipos de atividade (alinhado ao CardActivityForm). */
const ICON_OPTIONS = [
  { value: "Calendar", label: "Calendário" },
  { value: "Phone", label: "Telefone" },
  { value: "Mail", label: "E-mail" },
  { value: "MessageCircle", label: "Mensagem" },
  { value: "CheckCircle", label: "Concluído" },
  { value: "User", label: "Usuário" },
  { value: "Briefcase", label: "Reunião" },
  { value: "FileText", label: "Documento" },
];

interface ActivityTypesManagerProps {
  clientId: string;
}

export function ActivityTypesManager({ clientId }: ActivityTypesManagerProps) {
  const [editingType, setEditingType] = useState<FlowActivityTypeWithFlow | null>(null);
  const [typeToToggle, setTypeToToggle] = useState<FlowActivityTypeWithFlow | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    color: "#3B82F6",
    icon: "Calendar",
    active: true,
  });

  const { data: types = [], isLoading } = useFlowActivityTypesByClient(clientId);
  const updateType = useUpdateFlowActivityType();

  const handleOpenEdit = (type: FlowActivityTypeWithFlow) => {
    setEditingType(type);
    setEditForm({
      name: type.name,
      color: type.color || "#3B82F6",
      icon: type.icon || "Calendar",
      active: type.active,
    });
  };

  const handleCloseEdit = () => {
    setEditingType(null);
    setEditForm({ name: "", color: "#3B82F6", icon: "Calendar", active: true });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType || !editForm.name.trim()) return;

    try {
      await updateType.mutateAsync({
        id: editingType.id,
        flowId: editingType.flow_id,
        input: {
          name: editForm.name.trim(),
          color: editForm.color || null,
          icon: editForm.icon || null,
          active: editForm.active,
        },
      });
      handleCloseEdit();
    } catch (err) {
      console.error("Erro ao atualizar tipo de atividade:", err);
    }
  };

  const handleConfirmToggle = async () => {
    if (!typeToToggle) return;
    const newActive = !typeToToggle.active;
    try {
      await updateType.mutateAsync({
        id: typeToToggle.id,
        flowId: typeToToggle.flow_id,
        input: { active: newActive },
      });
      setTypeToToggle(null);
    } catch (err) {
      console.error("Erro ao alterar status:", err);
    }
  };

  const flowName = (type: FlowActivityTypeWithFlow) =>
    type.flow?.name ?? type.flow_id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Carregando tipos de atividade...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {types.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-dashed bg-muted/30">
          <p className="text-muted-foreground">
            Nenhum tipo de atividade. Crie tipos ao adicionar atividades nos cards do
            fluxo.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Flow</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Ícone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {flowName(type)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {type.color && (
                        <span
                          className="inline-block w-5 h-5 rounded border border-border"
                          style={{ backgroundColor: type.color }}
                          aria-hidden
                        />
                      )}
                      <span className="text-sm">{type.color ?? "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{type.icon ?? "-"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={type.active ? "default" : "secondary"}>
                      {type.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(type)}
                        className="h-8 w-8 p-0"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTypeToToggle(type)}
                        className={cn(
                          "h-8 w-8 p-0",
                          type.active ? "text-destructive" : "text-muted-foreground"
                        )}
                        title={type.active ? "Desativar" : "Ativar"}
                      >
                        {type.active ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de edição */}
      <Dialog open={!!editingType} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar tipo de atividade</DialogTitle>
            <DialogDescription>
              Altere nome, cor, ícone e status. O tipo continuará vinculado ao mesmo
              flow.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Reunião, Ligação"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Cor</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="edit-color"
                  value={editForm.color}
                  onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))}
                  className="h-9 w-14 cursor-pointer rounded border border-input bg-background"
                />
                <Input
                  value={editForm.color}
                  onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))}
                  placeholder="#3B82F6"
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-icon">Ícone</Label>
              <Select
                value={editForm.icon}
                onValueChange={(v) => setEditForm((f) => ({ ...f, icon: v }))}
              >
                <SelectTrigger id="edit-icon">
                  <SelectValue placeholder="Selecione o ícone" />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="edit-active">Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Tipos inativos não aparecem na seleção de novas atividades.
                </p>
              </div>
              <Switch
                id="edit-active"
                checked={editForm.active}
                onCheckedChange={(v) => setEditForm((f) => ({ ...f, active: v }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseEdit}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateType.isPending}>
                {updateType.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação desativar/ativar */}
      <AlertDialog
        open={!!typeToToggle}
        onOpenChange={(open) => !open && setTypeToToggle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {typeToToggle?.active ? "Desativar tipo de atividade?" : "Ativar tipo de atividade?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {typeToToggle?.active ? (
                <>
                  O tipo &quot;{typeToToggle.name}&quot; não aparecerá mais na seleção de
                  novas atividades. Atividades já criadas com este tipo permanecem
                  inalteradas.
                </>
              ) : (
                <>
                  O tipo &quot;{typeToToggle?.name}&quot; voltará a aparecer na seleção
                  de novas atividades.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggle}
              className={typeToToggle?.active ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {typeToToggle?.active ? "Desativar" : "Ativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useFranchises, useCreateFranchise, useUpdateFranchise, useDeleteFranchise, Franchise } from "@/hooks/useFranchises";
import { supabase } from "@/lib/supabase";
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

interface FranchisesManagerProps {
  clientId: string;
}

interface FranchiseFormData {
  name: string;
  code: string;
  description: string;
  is_active: boolean;
}

export function FranchisesManager({ clientId }: FranchisesManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [franchiseToEdit, setFranchiseToEdit] = useState<Franchise | null>(null);
  const [franchiseToDelete, setFranchiseToDelete] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState<FranchiseFormData>({
    name: "",
    code: "",
    description: "",
    is_active: true,
  });

  const { data: franchises = [], isLoading } = useFranchises(clientId);
  const createFranchise = useCreateFranchise();
  const updateFranchise = useUpdateFranchise();
  const deleteFranchise = useDeleteFranchise();

  const validateCode = async (code: string) => {
    if (!code || !code.trim()) {
      setCodeError(null);
      return;
    }

    setIsValidatingCode(true);
    setCodeError(null);

    try {
      const { data: existing, error } = await supabase
        .from("core_franchises")
        .select("id, code")
        .eq("code", code.trim())
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      // Se encontrou uma unidade com o mesmo código e não é a mesma que está editando
      if (existing && (!franchiseToEdit || existing.id !== franchiseToEdit.id)) {
        setCodeError(`O código "${code.trim()}" já está em uso por outra unidade`);
      } else {
        setCodeError(null);
      }
    } catch (error: any) {
      console.error("Erro ao validar código:", error);
      setCodeError("Erro ao validar código. Tente novamente.");
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Validação com debounce
  useEffect(() => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    if (formData.code && formData.code.trim()) {
      validationTimeoutRef.current = setTimeout(() => {
        validateCode(formData.code);
      }, 500);
    } else {
      setCodeError(null);
    }

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.code]);

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      is_active: true,
    });
    setCodeError(null);
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (franchise: Franchise) => {
    setFranchiseToEdit(franchise);
    setFormData({
      name: franchise.name,
      code: franchise.code || "",
      description: franchise.description || "",
      is_active: franchise.is_active ?? true,
    });
    setCodeError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("O nome da unidade é obrigatório");
      return;
    }

    // Validar código único se fornecido
    if (codeError) {
      toast.error(codeError);
      return;
    }

    if (formData.code && formData.code.trim()) {
      // Verificar novamente antes de salvar
      try {
        const { data: existing, error } = await supabase
          .from("core_franchises")
          .select("id, code")
          .eq("code", formData.code.trim())
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        // Se encontrou uma unidade com o mesmo código e não é a mesma que está editando
        if (existing && (!franchiseToEdit || existing.id !== franchiseToEdit.id)) {
          setCodeError(`O código "${formData.code.trim()}" já está em uso por outra unidade`);
          toast.error(`O código "${formData.code.trim()}" já está em uso por outra unidade`);
          return;
        }
      } catch (error: any) {
        console.error("Erro ao verificar código:", error);
        toast.error("Erro ao verificar código. Tente novamente.");
        return;
      }
    }

    try {
      if (franchiseToEdit) {
        await updateFranchise.mutateAsync({
          id: franchiseToEdit.id,
          input: {
            name: formData.name,
            code: formData.code?.trim() || null,
            description: formData.description || null,
            is_active: formData.is_active,
          },
        });
        setFranchiseToEdit(null);
      } else {
        await createFranchise.mutateAsync({
          client_id: clientId,
          name: formData.name,
          code: formData.code?.trim() || null,
          description: formData.description || null,
          is_active: formData.is_active,
        });
      }

      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        code: "",
        description: "",
        is_active: true,
      });
    } catch (error) {
      console.error("Erro ao salvar unidade:", error);
    }
  };

  const handleDelete = async () => {
    if (!franchiseToDelete) return;

    try {
      await deleteFranchise.mutateAsync({
        id: franchiseToDelete,
        clientId,
      });
      setFranchiseToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir unidade:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Carregando unidades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Unidades (Franquias)</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as unidades/franquias desta empresa
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Unidade
        </Button>
      </div>

      {franchises.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma unidade cadastrada</p>
          <p className="text-sm">Clique em "Nova Unidade" para começar</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {franchises.map((franchise) => (
                <TableRow key={franchise.id}>
                  <TableCell className="font-medium">{franchise.name}</TableCell>
                  <TableCell>
                    {franchise.code ? (
                      <Badge variant="outline">{franchise.code}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {franchise.description || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={franchise.is_active ? "default" : "secondary"}>
                      {franchise.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(franchise)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFranchiseToDelete(franchise.id)}
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
        open={isCreateDialogOpen || !!franchiseToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setFranchiseToEdit(null);
            setFormData({
              name: "",
              code: "",
              description: "",
              is_active: true,
            });
            setCodeError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {franchiseToEdit ? "Editar Unidade" : "Nova Unidade"}
            </DialogTitle>
            <DialogDescription>
              {franchiseToEdit
                ? "Edite as informações da unidade/franquia"
                : "Cadastre uma nova unidade/franquia para esta empresa"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Unidade *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Unidade São Paulo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Código (opcional)</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => {
                  setFormData({ ...formData, code: e.target.value });
                  setCodeError(null); // Limpar erro ao digitar
                }}
                onBlur={() => {
                  if (formData.code.trim()) {
                    validateCode(formData.code);
                  }
                }}
                placeholder="Ex: SP01, FR001"
                className={codeError ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {codeError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span>⚠️</span>
                  {codeError}
                </p>
              )}
              {!codeError && isValidatingCode && (
                <p className="text-xs text-muted-foreground">Validando código...</p>
              )}
              {!codeError && !isValidatingCode && formData.code.trim() && (
                <p className="text-xs text-green-600">✓ Código disponível</p>
              )}
              {!codeError && !isValidatingCode && !formData.code.trim() && (
                <p className="text-xs text-muted-foreground">
                  Código único para identificar a unidade
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da unidade"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Unidade ativa
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setFranchiseToEdit(null);
                }}
                disabled={createFranchise.isPending || updateFranchise.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createFranchise.isPending || updateFranchise.isPending || !!codeError || isValidatingCode}
              >
                {createFranchise.isPending || updateFranchise.isPending
                  ? "Salvando..."
                  : franchiseToEdit
                  ? "Salvar Alterações"
                  : "Criar Unidade"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!franchiseToDelete} onOpenChange={(open) => !open && setFranchiseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta unidade? Esta ação não pode ser desfeita.
              Os times vinculados a esta unidade não serão excluídos, mas perderão a vinculação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

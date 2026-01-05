import { useState, useEffect, useRef } from "react";
import { useItems, useCreateItem, useUpdateItem, useDeleteItem, WebItem } from "@/hooks/useItems";
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

interface ItemsManagerProps {
  clientId: string;
}

interface ItemFormData {
  name: string;
  description: string;
  price: string;
  item_code: string;
  item_type: "product" | "service" | "";
  billing_type: "one_time" | "recurring" | "";
  is_active: boolean;
}

export function ItemsManager({ clientId }: ItemsManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<WebItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState<ItemFormData>({
    name: "",
    description: "",
    price: "",
    item_code: "",
    item_type: "",
    billing_type: "",
    is_active: true,
  });

  const { data: items = [], isLoading } = useItems(clientId);
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const validateCode = async (code: string) => {
    if (!code || !code.trim()) {
      setCodeError(null);
      return;
    }

    setIsValidatingCode(true);
    setCodeError(null);

    try {
      const { data: existing, error } = await supabase
        .from("web_items")
        .select("id, item_code")
        .eq("item_code", code.trim())
        .eq("client_id", clientId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      // Se encontrou um item com o mesmo código e não é o mesmo que está editando
      if (existing && (!itemToEdit || existing.id !== itemToEdit.id)) {
        setCodeError(`O código "${code.trim()}" já está em uso por outro item`);
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

    if (formData.item_code && formData.item_code.trim()) {
      validationTimeoutRef.current = setTimeout(() => {
        validateCode(formData.item_code);
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
  }, [formData.item_code]);

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      item_code: "",
      item_type: "",
      billing_type: "",
      is_active: true,
    });
    setCodeError(null);
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (item: WebItem) => {
    setItemToEdit(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price?.toString() || "",
      item_code: item.item_code || "",
      item_type: item.item_type,
      billing_type: item.billing_type,
      is_active: item.is_active ?? true,
    });
    setCodeError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("O nome do item é obrigatório");
      return;
    }

    if (!formData.item_type) {
      toast.error("O tipo do item é obrigatório");
      return;
    }

    if (!formData.billing_type) {
      toast.error("O tipo de cobrança é obrigatório");
      return;
    }

    // Validar código único se fornecido
    if (codeError) {
      toast.error(codeError);
      return;
    }

    if (formData.item_code && formData.item_code.trim()) {
      // Verificar novamente antes de salvar
      try {
        const { data: existing, error } = await supabase
          .from("web_items")
          .select("id, item_code")
          .eq("item_code", formData.item_code.trim())
          .eq("client_id", clientId)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        // Se encontrou um item com o mesmo código e não é o mesmo que está editando
        if (existing && (!itemToEdit || existing.id !== itemToEdit.id)) {
          setCodeError(`O código "${formData.item_code.trim()}" já está em uso por outro item`);
          toast.error(`O código "${formData.item_code.trim()}" já está em uso por outro item`);
          return;
        }
      } catch (error: any) {
        console.error("Erro ao verificar código:", error);
        toast.error("Erro ao verificar código. Tente novamente.");
        return;
      }
    }

    try {
      const itemData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price ? parseFloat(formData.price) : null,
        item_code: formData.item_code?.trim() || null,
        item_type: formData.item_type as "product" | "service",
        billing_type: formData.billing_type as "one_time" | "recurring",
        is_active: formData.is_active,
      };

      if (itemToEdit) {
        await updateItem.mutateAsync({
          id: itemToEdit.id,
          input: itemData,
        });
        setItemToEdit(null);
      } else {
        await createItem.mutateAsync({
          client_id: clientId,
          ...itemData,
        });
      }

      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        price: "",
        item_code: "",
        item_type: "",
        billing_type: "",
        is_active: true,
      });
    } catch (error) {
      console.error("Erro ao salvar item:", error);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const item = items.find((i) => i.id === itemToDelete);
      if (!item) return;

      await deleteItem.mutateAsync({
        id: itemToDelete,
        clientId: item.client_id,
      });
      setItemToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir item:", error);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Carregando itens...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Itens de Orçamento</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os produtos e serviços disponíveis para orçamento
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum item cadastrado</p>
          <p className="text-sm">Clique em "Novo Item" para começar</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cobrança</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    {item.item_code ? (
                      <Badge variant="outline">{item.item_code}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {item.item_type === "product" ? "Produto" : "Serviço"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.billing_type === "one_time" ? "Único" : "Recorrente"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPrice(item.price)}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setItemToDelete(item.id)}
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
        open={isCreateDialogOpen || !!itemToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setItemToEdit(null);
            setFormData({
              name: "",
              description: "",
              price: "",
              item_code: "",
              item_type: "",
              billing_type: "",
              is_active: true,
            });
            setCodeError(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {itemToEdit ? "Editar Item" : "Novo Item"}
            </DialogTitle>
            <DialogDescription>
              {itemToEdit
                ? "Edite as informações do item de orçamento"
                : "Cadastre um novo produto ou serviço para orçamento"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Item *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Plano Mensal, Produto X"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item_code">Código (opcional)</Label>
                <Input
                  id="item_code"
                  value={formData.item_code}
                  onChange={(e) => {
                    setFormData({ ...formData, item_code: e.target.value });
                    setCodeError(null);
                  }}
                  onBlur={() => {
                    if (formData.item_code.trim()) {
                      validateCode(formData.item_code);
                    }
                  }}
                  placeholder="Ex: XPTO, PLANO01"
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
                {!codeError && !isValidatingCode && formData.item_code.trim() && (
                  <p className="text-xs text-green-600">✓ Código disponível</p>
                )}
                {!codeError && !isValidatingCode && !formData.item_code.trim() && (
                  <p className="text-xs text-muted-foreground">
                    Código único para identificar o item
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição detalhada do item"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item_type">Tipo *</Label>
                <Select
                  value={formData.item_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, item_type: value as "product" | "service" })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Produto</SelectItem>
                    <SelectItem value="service">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_type">Tipo de Cobrança *</Label>
                <Select
                  value={formData.billing_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, billing_type: value as "one_time" | "recurring" })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">Único</SelectItem>
                    <SelectItem value="recurring">Recorrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
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
                Item ativo
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setItemToEdit(null);
                }}
                disabled={createItem.isPending || updateItem.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createItem.isPending || updateItem.isPending || !!codeError || isValidatingCode}
              >
                {createItem.isPending || updateItem.isPending
                  ? "Salvando..."
                  : itemToEdit
                  ? "Salvar Alterações"
                  : "Criar Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
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

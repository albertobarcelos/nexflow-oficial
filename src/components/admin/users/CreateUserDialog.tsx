import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamSelect } from "./TeamSelect";
import { ClientSelect } from "./ClientSelect";
import { OrganizationUser } from "@/hooks/useOrganizationUsers";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: OrganizationUser & { clientId?: string; teamId?: string };
  defaultClientId?: string; // Client ID padrão ao criar novo usuário
  onSuccess?: () => void;
}

type UserRole = "administrator" | "closer" | "partnership_director" | "partner";

interface FormData {
  name: string;
  surname: string;
  email: string;
  password: string;
  role?: UserRole;
  teamId?: string;
  clientId?: string;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  user,
  defaultClientId,
  onSuccess,
}: CreateUserDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!user;
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    surname: "",
    email: "",
    password: "",
    role: undefined,
    teamId: undefined,
    clientId: defaultClientId || undefined,
  });

  // Carregar dados do usuário quando em modo de edição
  useEffect(() => {
    if (open && isEditMode && user) {
      loadUserData();
    } else if (open && !isEditMode) {
      // Limpar formulário quando abrir em modo de criação
      setFormData({
        name: "",
        surname: "",
        email: "",
        password: "",
        role: undefined,
        teamId: undefined,
        clientId: defaultClientId || undefined,
      });
    }
  }, [open, isEditMode, user, defaultClientId]);

  const loadUserData = async () => {
    if (!user) return;

    setIsLoadingUserData(true);
    try {
      // Buscar clientId do usuário
      const { data: userData, error: userError } = await supabase
        .from("core_client_users")
        .select("client_id")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error("Erro ao buscar clientId:", userError);
      }

      // Buscar teamId do usuário
      const { data: teamData, error: teamError } = await (supabase as any)
        .from("core_team_members")
        .select("team_id")
        .eq("user_profile_id", user.id)
        .limit(1)
        .maybeSingle();

      if (teamError) {
        console.error("Erro ao buscar teamId:", teamError);
      }

      // Preencher formulário com dados do usuário
      setFormData({
        name: user.name || "",
        surname: user.surname || "",
        email: user.email || "",
        password: "", // Senha não é carregada por segurança
        role: (user.role as UserRole) || undefined,
        teamId: teamData?.team_id || undefined,
        clientId: userData?.client_id || user.clientId || undefined,
      });
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      toast.error("Erro ao carregar dados do usuário");
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | UserRole | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("O campo Nome é obrigatório");
      return false;
    }
    if (!formData.surname.trim()) {
      toast.error("O campo Sobrenome é obrigatório");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("O campo Email é obrigatório");
      return false;
    }
    if (!formData.email.includes("@")) {
      toast.error("Email inválido");
      return false;
    }
    // Senha só é obrigatória em modo de criação
    if (!isEditMode && !formData.password.trim()) {
      toast.error("O campo Senha é obrigatório");
      return false;
    }
    // Se senha foi preenchida, validar tamanho mínimo
    if (formData.password.trim() && formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return false;
    }
    // Cliente só é obrigatório em modo de criação
    if (!isEditMode && !formData.clientId) {
      toast.error("O campo Cliente/Empresa é obrigatório");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isEditMode && user) {
        // Modo de edição - chamar edge function de update
        const requestBody: {
          userId: string;
          email?: string;
          password?: string;
          name?: string;
          surname?: string;
          role?: UserRole;
          teamId?: string;
        } = {
          userId: user.id,
        };

        // Adicionar apenas campos que foram modificados
        if (formData.email) requestBody.email = formData.email;
        if (formData.password.trim()) requestBody.password = formData.password;
        if (formData.name) requestBody.name = formData.name;
        if (formData.surname) requestBody.surname = formData.surname;
        if (formData.role) requestBody.role = formData.role;
        // Sempre enviar teamId se foi carregado (permite mudar ou manter)
        // A edge function só processa se teamId for truthy
        if (formData.teamId) {
          requestBody.teamId = formData.teamId;
        }

        const { data, error } = await supabase.functions.invoke(
          "update-user",
          {
            body: requestBody,
          }
        );

        if (error) {
          throw error;
        }

        // Invalidar query para atualizar lista de usuários
        queryClient.invalidateQueries({ queryKey: ["organization-users"] });

        toast.success("Usuário atualizado com sucesso!");

        // Limpar formulário
        setFormData({
          name: "",
          surname: "",
          email: "",
          password: "",
          role: undefined,
          teamId: undefined,
          clientId: undefined,
        });

        // Fechar dialog
        onOpenChange(false);
        onSuccess?.();
      } else {
        // Modo de criação - chamar edge function de create
        const requestBody: {
          email: string;
          password: string;
          name: string;
          surname: string;
          clientId: string;
          teamId?: string;
          role?: UserRole;
        } = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          surname: formData.surname,
          clientId: formData.clientId!,
        };

        // Adicionar campos opcionais apenas se preenchidos
        if (formData.teamId) {
          requestBody.teamId = formData.teamId;
        }
        if (formData.role) {
          requestBody.role = formData.role;
        }

        const { data, error } = await supabase.functions.invoke(
          "admin-create-user",
          {
            body: requestBody,
          }
        );

        if (error) {
          throw error;
        }

        // Invalidar query para atualizar lista de usuários
        queryClient.invalidateQueries({ queryKey: ["organization-users"] });

        toast.success("Usuário criado com sucesso!");

        // Limpar formulário
        setFormData({
          name: "",
          surname: "",
          email: "",
          password: "",
          role: undefined,
          teamId: undefined,
          clientId: undefined,
        });

        // Fechar dialog
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error: any) {
      console.error(
        `Erro ao ${isEditMode ? "atualizar" : "criar"} usuário:`,
        error
      );
      toast.error(
        error?.message ||
          `Erro ao ${isEditMode ? "atualizar" : "criar"} usuário. Tente novamente.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Usuário" : "Criar Novo Usuário"}
          </DialogTitle>
        </DialogHeader>

        {isLoadingUserData && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">
              Carregando dados do usuário...
            </p>
          </div>
        )}

        {!isLoadingUserData && (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Digite o nome"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="surname">Sobrenome *</Label>
              <Input
                id="surname"
                type="text"
                value={formData.surname}
                onChange={(e) => handleInputChange("surname", e.target.value)}
                placeholder="Digite o sobrenome"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Digite o email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Senha {!isEditMode && "*"}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder={
                isEditMode
                  ? "Deixe em branco para manter a senha atual"
                  : "Digite a senha"
              }
              required={!isEditMode}
              disabled={isLoading}
            />
            {isEditMode && (
              <p className="text-xs text-muted-foreground">
                Deixe em branco para manter a senha atual
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select
              value={formData.role}
              onValueChange={(value: UserRole) =>
                handleInputChange("role", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="administrator">Administrador</SelectItem>
                <SelectItem value="closer">Closer</SelectItem>
                <SelectItem value="partnership_director">
                  Diretor de Parcerias
                </SelectItem>
                <SelectItem value="partner">Parceiro</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Se não selecionado, será definido como "Closer" por padrão
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team">Time</Label>
            <TeamSelect
              value={formData.teamId}
              onChange={(value) => handleInputChange("teamId", value)}
            />
          </div>

          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="client">Cliente/Empresa *</Label>
              <ClientSelect
                value={formData.clientId}
                onChange={(value) => handleInputChange("clientId", value)}
              />
            </div>
          )}
          {isEditMode && formData.clientId && (
            <div className="space-y-2">
              <Label htmlFor="client">Cliente/Empresa</Label>
              <Input
                id="client"
                type="text"
                value="Cliente atual (não editável)"
                disabled
                className="bg-muted"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingUserData}>
              {isLoading
                ? isEditMode
                  ? "Salvando..."
                  : "Criando..."
                : isEditMode
                ? "Salvar Alterações"
                : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


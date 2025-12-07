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
import { LicenseSelect } from "./LicenseSelect";
import { OrganizationCompany } from "@/hooks/useOrganizationCompanies";

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: OrganizationCompany;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  email: string;
  company_name: string;
  cpf_cnpj: string;
  phone: string;
  contact_name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  license_id?: string;
}

export function CreateCompanyDialog({
  open,
  onOpenChange,
  company,
  onSuccess,
}: CreateCompanyDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!company;
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company_name: "",
    cpf_cnpj: "",
    phone: "",
    contact_name: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    license_id: undefined,
  });

  // Carregar dados da empresa quando em modo de edição
  useEffect(() => {
    if (open && isEditMode && company) {
      loadCompanyData();
    } else if (open && !isEditMode) {
      // Limpar formulário quando abrir em modo de criação
      setFormData({
        name: "",
        email: "",
        company_name: "",
        cpf_cnpj: "",
        phone: "",
        contact_name: "",
        address: "",
        city: "",
        state: "",
        postal_code: "",
        license_id: undefined,
      });
    }
  }, [open, isEditMode, company]);

  const loadCompanyData = async () => {
    if (!company) return;

    setIsLoadingCompanyData(true);
    try {
      // Buscar dados completos da empresa
      const { data: companyData, error } = await supabase
        .from("core_clients")
        .select("*")
        .eq("id", company.id)
        .single();

      if (error) throw error;

      // Preencher formulário com dados da empresa
      setFormData({
        name: companyData.name || "",
        email: companyData.email || "",
        company_name: companyData.company_name || "",
        cpf_cnpj: companyData.cpf_cnpj || "",
        phone: companyData.phone || "",
        contact_name: companyData.contact_name || "",
        address: companyData.address || "",
        city: companyData.city || "",
        state: companyData.state || "",
        postal_code: companyData.postal_code || "",
        license_id: companyData.license_id || undefined,
      });
    } catch (error) {
      console.error("Erro ao carregar dados da empresa:", error);
      toast.error("Erro ao carregar dados da empresa");
    } finally {
      setIsLoadingCompanyData(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("O campo Nome é obrigatório");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("O campo E-mail é obrigatório");
      return false;
    }
    if (!formData.company_name.trim()) {
      toast.error("O campo Razão Social é obrigatório");
      return false;
    }
    if (!formData.cpf_cnpj.trim()) {
      toast.error("O campo CPF/CNPJ é obrigatório");
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
      if (isEditMode && company) {
        // Modo de edição - UPDATE direto no Supabase
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          company_name: formData.company_name,
          cpf_cnpj: formData.cpf_cnpj,
          phone: formData.phone || null,
          contact_name: formData.contact_name || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          postal_code: formData.postal_code || null,
          license_id: formData.license_id || null,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("core_clients")
          .update(updateData)
          .eq("id", company.id);

        if (error) {
          throw error;
        }

        // Atualizar ou criar vínculo em core_client_license se license_id foi fornecido
        if (formData.license_id) {
          try {
            // Verificar se já existe vínculo para este cliente
            const { data: existingLicense, error: checkError } = await supabase
              .from("core_client_license")
              .select("id, license_id, user_limit")
              .eq("client_id", company.id)
              .maybeSingle();

            if (checkError && checkError.code !== "PGRST116") {
              console.error("Erro ao verificar vínculo de licença:", checkError);
            }

            // Buscar informações da licença para obter user_quantity
            const { data: licenseData, error: licenseError } = await supabase
              .from("core_licenses")
              .select("user_quantity")
              .eq("id", formData.license_id)
              .single();

            if (licenseError) {
              console.error("Erro ao buscar licença:", licenseError);
            }

            if (existingLicense) {
              // Atualizar vínculo existente
              const { error: updateLicenseError } = await supabase
                .from("core_client_license")
                .update({
                  license_id: formData.license_id,
                  user_limit: licenseData?.user_quantity || existingLicense.user_limit || 10,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingLicense.id);

              if (updateLicenseError) {
                console.error("Erro ao atualizar vínculo de licença:", updateLicenseError);
              }
            } else {
              // Criar novo vínculo
              const startDate = new Date();
              const expirationDate = new Date();
              expirationDate.setFullYear(expirationDate.getFullYear() + 1);

              const { error: createLicenseError } = await supabase
                .from("core_client_license")
                .insert({
                  client_id: company.id,
                  license_id: formData.license_id,
                  type: "premium",
                  status: "active",
                  start_date: startDate.toISOString(),
                  expiration_date: expirationDate.toISOString(),
                  user_limit: licenseData?.user_quantity || 10,
                  can_use_nexhunters: true,
                });

              if (createLicenseError) {
                console.error("Erro ao criar vínculo de licença:", createLicenseError);
              }
            }
          } catch (error) {
            console.error("Erro ao processar vínculo de licença:", error);
            // Não falhar a atualização do cliente se o vínculo falhar
          }
        }
        // Se license_id foi removido, mantemos o registro em core_client_license como está
        // (não desativamos automaticamente)

        // Invalidar query para atualizar lista de empresas
        queryClient.invalidateQueries({ queryKey: ["organization-companies"] });

        toast.success("Empresa atualizada com sucesso!");

        // Limpar formulário
        setFormData({
          name: "",
          email: "",
          company_name: "",
          cpf_cnpj: "",
          phone: "",
          contact_name: "",
          address: "",
          city: "",
          state: "",
          postal_code: "",
          license_id: undefined,
        });

        // Fechar dialog
        onOpenChange(false);
        onSuccess?.();
      } else {
        // Modo de criação - chamar edge function de create
        const requestBody = {
          name: formData.name,
          email: formData.email,
          company_name: formData.company_name,
          cpf_cnpj: formData.cpf_cnpj,
          phone: formData.phone || undefined,
          contact_name: formData.contact_name || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          postal_code: formData.postal_code || undefined,
          license_id: formData.license_id || undefined,
        };

        const { data, error } = await supabase.functions.invoke("create-empresa", {
          body: requestBody,
        });

        if (error) {
          throw error;
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        // Invalidar query para atualizar lista de empresas
        queryClient.invalidateQueries({ queryKey: ["organization-companies"] });

        toast.success("Empresa criada com sucesso!");

        // Limpar formulário
        setFormData({
          name: "",
          email: "",
          company_name: "",
          cpf_cnpj: "",
          phone: "",
          contact_name: "",
          address: "",
          city: "",
          state: "",
          postal_code: "",
          license_id: undefined,
        });

        // Fechar dialog
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error: any) {
      console.error(
        `Erro ao ${isEditMode ? "atualizar" : "criar"} empresa:`,
        error
      );
      toast.error(
        error?.message ||
          `Erro ao ${isEditMode ? "atualizar" : "criar"} empresa. Tente novamente.`
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
            {isEditMode ? "Editar Empresa" : "Criar Nova Empresa"}
          </DialogTitle>
        </DialogHeader>

        {isLoadingCompanyData && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">
              Carregando dados da empresa...
            </p>
          </div>
        )}

        {!isLoadingCompanyData && (
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
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Digite o e-mail"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Razão Social *</Label>
                <Input
                  id="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  placeholder="Digite a razão social"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
                <Input
                  id="cpf_cnpj"
                  type="text"
                  value={formData.cpf_cnpj}
                  onChange={(e) => handleInputChange("cpf_cnpj", e.target.value)}
                  placeholder="Digite o CPF/CNPJ"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Digite o telefone"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_name">Nome do Contato</Label>
                <Input
                  id="contact_name"
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => handleInputChange("contact_name", e.target.value)}
                  placeholder="Digite o nome do contato"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Digite o endereço"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Digite a cidade"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="Digite o estado"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">CEP</Label>
                <Input
                  id="postal_code"
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange("postal_code", e.target.value)}
                  placeholder="Digite o CEP"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license">Licença</Label>
              <LicenseSelect
                value={formData.license_id}
                onChange={(value) => handleInputChange("license_id", value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || isLoadingCompanyData}>
                {isLoading
                  ? isEditMode
                    ? "Salvando..."
                    : "Criando..."
                  : isEditMode
                  ? "Salvar Alterações"
                  : "Criar Empresa"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrganizationCompanies, OrganizationCompany } from "@/hooks/useOrganizationCompanies";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Power, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { CreateCompanyDialog } from "./CreateCompanyDialog";

export function CompaniesTab() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<OrganizationCompany | null>(null);
  const { data: companies, isLoading, error } = useOrganizationCompanies();

  const handleEdit = (companyId: string) => {
    const company = companies?.find((c) => c.id === companyId);
    if (company) {
      setCompanyToEdit(company);
    }
  };

  const handleToggleStatus = async (company: OrganizationCompany) => {
    try {
      const requestBody = {
        clientId: company.id,
      };

      const { error } = await supabase.functions.invoke("toggle-client-stats", {
        body: requestBody,
      });

      if (error) {
        throw error;
      }

      // Invalidar query para atualizar lista de empresas
      queryClient.invalidateQueries({ queryKey: ["organization-companies"] });

      toast.success(
        company.status === "active"
          ? "Empresa desativada com sucesso!"
          : "Empresa ativada com sucesso!"
      );
    } catch (error: any) {
      console.error("Erro ao alternar status da empresa:", error);
      toast.error(
        error?.message || "Erro ao alternar status da empresa. Tente novamente."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Carregando empresas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-500">Erro ao carregar empresas</p>
      </div>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Nova Empresa
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Nenhuma empresa encontrada</p>
        </div>

        <CreateCompanyDialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) setCompanyToEdit(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Nova Empresa
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome/Razão Social</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade/Estado</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell>
                  <div>
                    <span className="font-medium">{company.company_name || company.name}</span>
                    {company.contact_name && (
                      <p className="text-xs text-gray-500">{company.contact_name}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {company.cpf_cnpj || "Não informado"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {company.email || "Não informado"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {company.phone || "Não informado"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {company.city && company.state
                      ? `${company.city}, ${company.state}`
                      : company.city || company.state || "Não informado"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={company.status === "active" ? "default" : "secondary"}
                    className={
                      company.status === "active"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                    }
                  >
                    {company.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(company.id)}
                      className="h-8 w-8 p-0"
                      title="Editar empresa"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(company)}
                      className="h-8 w-8 p-0"
                      title={company.status === "active" ? "Desativar" : "Ativar"}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateCompanyDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setCompanyToEdit(null);
        }}
      />

      <CreateCompanyDialog
        open={!!companyToEdit}
        onOpenChange={(open) => {
          if (!open) setCompanyToEdit(null);
        }}
        company={companyToEdit || undefined}
        onSuccess={() => {
          setCompanyToEdit(null);
        }}
      />
    </div>
  );
}


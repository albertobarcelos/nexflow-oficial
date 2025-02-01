import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Download, Import, MapPin, Mail, Phone } from "lucide-react";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Database } from "@/types/supabase";
import { CompanyPopup } from "@/features/companies/components/CompanyPopup";
import { CompanyForm } from "@/features/companies/components/form/CompanyForm";
import { toast } from "sonner";
import { formatCNPJ, formatPhone } from "@/lib/format";

type Company = Database["public"]["Tables"]["companies"]["Row"];

export function CompaniesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { companies, isLoading, deleteCompany } = useCompanies({ search });
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState(false);

  const filteredCompanies = companies?.filter((company) =>
    company.name?.toLowerCase().includes(search.toLowerCase()) ||
    company.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
    company.cnpj?.toLowerCase().includes(search.toLowerCase()) ||
    company.email?.toLowerCase().includes(search.toLowerCase()) ||
    company.whatsapp?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (e: React.MouseEvent, company: Company) => {
    e.stopPropagation();
    setCompanyToEdit(company);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (company: Company) => {
    setIsDeleting(true);
    try {
      await deleteCompany(company.id);
      setCompanyToDelete(null);
      toast.success("Empresa excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir empresa:", error);
      toast.error("Erro ao excluir empresa");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDENTE: "bg-yellow-500",
      ATIVO: "bg-green-500",
      INATIVO: "bg-gray-500",
      BLOQUEADO: "bg-red-500"
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Empresas</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Import className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsNewCompanyDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Empresa
          </Button>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por nome, razão social, CNPJ, email ou whatsapp"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xl"
        />
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Logo</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Empresa</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">CNPJ</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Contato</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Localização</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-3 px-4 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : filteredCompanies?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-3 px-4 text-center text-muted-foreground">
                    Nenhuma empresa encontrada
                  </td>
                </tr>
              ) : (
                filteredCompanies?.map((company) => (
                  <tr 
                    key={company.id} 
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedCompany(company)}
                  >
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{company.name}</span>
                        {company.razao_social && (
                          <span className="text-sm text-muted-foreground">
                            {company.razao_social}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {company.cnpj ? formatCNPJ(company.cnpj) : "Não informado"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(company.status || "ATIVO")}>
                        {company.status || "ATIVO"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        {company.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3" />
                            {company.email}
                          </div>
                        )}
                        {company.whatsapp && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3" />
                            {formatPhone(company.whatsapp)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        {company.cidade && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-3 h-3" />
                            {company.cidade}
                          </div>
                        )}
                        {company.estado && (
                          <span className="text-sm text-muted-foreground">
                            {company.estado}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => handleEdit(e, company)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCompanyToDelete(company);
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-muted-foreground">
        Exibindo {filteredCompanies?.length} de {companies?.length} empresas
      </div>

      {/* Popups */}
      {selectedCompany && (
        <CompanyPopup
          company={selectedCompany}
          open={!!selectedCompany}
          onOpenChange={(open) => {
            if (!open) setSelectedCompany(null);
          }}
        />
      )}

      {/* Diálogo de Edição */}
      {companyToEdit && (
        <CompanyForm
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setCompanyToEdit(null);
          }}
          company={companyToEdit}
          onSuccess={(updatedCompany) => {
            // Atualizar a lista de empresas ou qualquer outra lógica necessária
          }}
        />
      )}

      {/* Diálogo de Nova Empresa */}
      <CompanyForm
        open={isNewCompanyDialogOpen}
        onOpenChange={setIsNewCompanyDialogOpen}
      />

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog 
        open={!!companyToDelete} 
        onOpenChange={() => !isDeleting && setCompanyToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa{" "}
              <span className="font-semibold">{companyToDelete?.name}</span>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => companyToDelete && handleDelete(companyToDelete)}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir empresa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

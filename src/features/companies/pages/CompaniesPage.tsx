import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Download, Import, MapPin, Mail, Phone, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Database } from "@/types/database";
import { CompanyPopup } from "@/features/companies/components/details/CompanyPopup";
import { CompanyForm } from "@/features/companies/components/form/CompanyForm";
import { toast } from "sonner";
import { formatCNPJ, formatPhone } from "@/lib/format";
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';

type Company = Database["public"]["Tables"]["companies"]["Row"];

export function CompaniesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { companies, isLoading, deleteCompany, refreshCompanies } = useCompanies({ search: debouncedSearch });
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState(false);
  const isMobile = useIsMobile();

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

  const CompanyCard = ({ company }: { company: Company }) => (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setSelectedCompany(company)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate">{company.name}</CardTitle>
              {company.razao_social && (
                <p className="text-sm text-muted-foreground truncate">
                  {company.razao_social}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => handleEdit(e, company)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setCompanyToDelete(company);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {company.cnpj && (
            <p className="text-sm font-mono">
              {formatCNPJ(company.cnpj)}
            </p>
          )}

          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(company.status || "ATIVO")}>
              {company.status || "ATIVO"}
            </Badge>
          </div>

          {(company.email || company.whatsapp) && (
            <div className="space-y-1">
              {company.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{company.email}</span>
                </div>
              )}
              {company.whatsapp && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span className="truncate">{formatPhone(company.whatsapp)}</span>
                </div>
              )}
            </div>
          )}

          {(company.cidade || company.estado) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate">
                {[company.cidade, company.estado].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Cabeçalho responsivo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <h1 className="text-xl md:text-2xl font-bold">Empresas</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          {!isMobile && (
            <>
              <Button variant="outline" size="sm">
                <Import className="w-4 h-4 mr-2" />
                Importar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </>
          )}
          <Button
            onClick={() => setIsNewCompanyDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Empresa
          </Button>
        </div>
      </div>

      {/* Barra de pesquisa responsiva */}
      <div className="flex items-center gap-2">
        <Input
          placeholder={isMobile ? "Buscar empresas..." : "Buscar por nome, razão social, CNPJ, email ou whatsapp"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Conteúdo responsivo */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando empresas...</p>
          </div>
        </div>
      ) : filteredCompanies?.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma empresa encontrada</p>
        </div>
      ) : isMobile ? (
        // Layout mobile: cards
        <div className="grid gap-4">
          {filteredCompanies?.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        // Layout desktop: tabela
        <div className="border rounded-lg overflow-hidden">
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
                {filteredCompanies?.map((company) => (
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => handleEdit(e, company)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCompanyToDelete(company);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* Formulário de Edição */}
      {companyToEdit && (
        <CompanyForm
          company={companyToEdit}
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setCompanyToEdit(null);
          }}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            setCompanyToEdit(null);
            refreshCompanies();
            toast.success('Empresa atualizada com sucesso!');
          }}
        />
      )}

      {/* Dialog de Nova Empresa */}
      <CompanyForm
        open={isNewCompanyDialogOpen}
        onOpenChange={setIsNewCompanyDialogOpen}
        onSuccess={() => {
          setIsNewCompanyDialogOpen(false);
          refreshCompanies();
        }}
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

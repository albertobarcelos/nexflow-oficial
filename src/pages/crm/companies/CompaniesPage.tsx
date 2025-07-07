import { useState } from "react";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Download, Import, Plus, Pencil, Trash } from "lucide-react";
import { CompanyPopup } from "@/components/crm/companies/CompanyPopup";
import { CompanyForm } from "@/components/crm/companies/CompanyForm";
import { toast } from "sonner";

export function CompaniesPage() {
    const { companies = [], isLoading, deleteCompany, refreshCompanies } = useCompanies();
    const [search, setSearch] = useState("");
    const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [companyToEdit, setCompanyToEdit] = useState<any | null>(null);

    const filteredCompanies = companies.filter((company) => {
        const matchesSearch =
            company.name?.toLowerCase().includes(search.toLowerCase()) ||
            company.cnpj?.toLowerCase().includes(search.toLowerCase()) ||
            company.email?.toLowerCase().includes(search.toLowerCase()) ||
            company.cidade?.toLowerCase().includes(search.toLowerCase()) ||
            company.estado?.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const handleEdit = (e: React.MouseEvent, company: any) => {
        e.stopPropagation();
        setCompanyToEdit(company);
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, company: any) => {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja remover esta empresa?")) return;
        try {
            await deleteCompany.mutateAsync(company.id);
            toast.success("Empresa removida com sucesso!");
            refreshCompanies();
        } catch (error) {
            toast.error("Erro ao remover empresa");
        }
    };

    return (
        <div className="space-y-4 p-8">
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
                    <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        variant="default"
                        className="bg-[#0f172a] hover:bg-[#0f172a]/90"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Empresa
                    </Button>
                </div>
            </div>

            {/* Barra de pesquisa */}
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Buscar empresas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-full"
                />
            </div>

            {/* Tabela */}
            <div className="border rounded-lg">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/100 rounded-t-md text-white">
                                <th className="py-1 px-3 text-left font-medium text-xs text-muted-foreground tracking-wide w-2/5 md:w-1/3 lg:w-1/4 rounded-tl-md">Nome</th>
                                <th className="py-1 px-3 text-center font-medium text-xs text-muted-foreground tracking-wide w-1/5 hidden sm:table-cell">Email</th>
                                <th className="py-1 px-3 text-center font-medium text-xs text-muted-foreground tracking-wide w-1/6 hidden sm:table-cell">Status</th>
                                <th className="py-1 px-3 text-center font-medium text-xs text-muted-foreground tracking-wide w-1/6 hidden sm:table-cell">Cidade/Estado</th>
                                <th className="py-1 px-3 text-right font-medium text-xs text-muted-foreground tracking-wide w-12 rounded-tr-md">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-3 px-4 text-center text-muted-foreground">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : filteredCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-3 px-4 text-center text-muted-foreground">
                                        Nenhuma empresa encontrada
                                    </td>
                                </tr>
                            ) : (
                                filteredCompanies.map((company) => (
                                    <tr
                                        key={company.id}
                                        className="border-b cursor-pointer hover:bg-muted/50"
                                        onClick={() => setSelectedCompany(company)}
                                    >
                                        {/* Nome + avatar + CNPJ */}
                                        <td className="py-3 px-4 w-2/5 md:w-1/3 lg:w-1/4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                                                    <Building2 className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm text-foreground">{company.name}</div>
                                                    <div className="text-xs text-muted-foreground">{company.cnpj || <span className="italic text-muted-foreground">CNPJ</span>}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Email */}
                                        <td className="py-3 px-4 text-center w-1/5 hidden sm:table-cell">
                                            {company.email || <span className="italic text-muted-foreground">Email</span>}
                                        </td>
                                        {/* Status */}
                                        <td className="py-3 px-4 text-center w-1/6 hidden sm:table-cell">
                                            <span className={`inline-block px-3 py-1 text-xs rounded-full ${company.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'} font-medium`}>{company.status || 'ATIVO'}</span>
                                        </td>
                                        {/* Cidade/Estado */}
                                        <td className="py-3 px-4 text-center w-1/6 hidden sm:table-cell">
                                            {company.cidade || company.estado ? (
                                                <span>{[company.cidade, company.estado].filter(Boolean).join(' / ')}</span>
                                            ) : (
                                                <span className="italic text-muted-foreground">Cidade/Estado</span>
                                            )}
                                        </td>
                                        {/* Ações */}
                                        <td className="py-2 px-2 text-right w-12">
                                            <div className="flex justify-end gap">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => handleEdit(e, company)}
                                                    aria-label="Editar"
                                                    className=" text-gray-400 hover:text-blue-600"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-400 hover:text-destructive"
                                                    onClick={(e) => handleDelete(e, company)}
                                                    aria-label="Excluir"
                                                >
                                                    <Trash className="w-4 h-4" />
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
                Exibindo {filteredCompanies.length} de {companies.length} empresas
            </div>

            {/* Popups */}
            {selectedCompany && (
                <CompanyPopup
                    company={selectedCompany}
                    open={!!selectedCompany}
                    onClose={() => setSelectedCompany(null)}
                />
            )}
            <CompanyForm
                open={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onSuccess={refreshCompanies}
            />
            <CompanyForm
                company={companyToEdit}
                open={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                onSuccess={refreshCompanies}
            />
        </div>
    );
}

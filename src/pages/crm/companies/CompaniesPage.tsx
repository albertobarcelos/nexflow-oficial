import { useState } from "react";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { useCompanyColumns } from "@/features/companies/hooks/useCompanyColumns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Import, Plus } from "lucide-react";
import { CompanyPopup } from "@/features/companies/components/details/CompanyPopup";
import { CompanyForm } from "@/features/companies/components/form/CompanyForm";
import { DynamicCompanyTable } from "@/features/companies/components/table/DynamicCompanyTable";
import { ColumnConfigDialog } from "@/features/companies/components/table/ColumnConfigDialog";
import { toast } from "sonner";

export function CompaniesPage() {
    const { companies = [], isLoading, deleteCompany, refreshCompanies } = useCompanies();
    const { columns, visibleColumns, reorderColumns, resetToDefault, toggleColumnVisibility, updateColumn } = useCompanyColumns();
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

            {/* Barra de pesquisa e configuração */}
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Buscar empresas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 rounded-full"
                />
                <ColumnConfigDialog
                    columns={columns}
                    onColumnsChange={reorderColumns}
                    onToggle={toggleColumnVisibility}
                    onReset={resetToDefault}
                />
            </div>

            {/* Tabela Dinâmica */}
            <DynamicCompanyTable
                companies={filteredCompanies}
                isLoading={isLoading}
                visibleColumns={visibleColumns}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRowClick={setSelectedCompany}
                onUpdateColumn={updateColumn}
            />

            {/* Contador de resultados */}
            <div className="text-sm text-muted-foreground">
                Exibindo {filteredCompanies.length} de {companies.length} empresas
            </div>

            {/* Popups */}
            {selectedCompany && (
                <CompanyPopup
                    company={selectedCompany}
                    open={!!selectedCompany}
                    onOpenChange={(open) => !open && setSelectedCompany(null)}
                />
            )}
            <CompanyForm
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSuccess={refreshCompanies}
            />
            <CompanyForm
                company={companyToEdit}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSuccess={refreshCompanies}
            />
        </div>
    );
}

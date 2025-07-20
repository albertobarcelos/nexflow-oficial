import { useState, useEffect } from "react";
import { useCompaniesPaginated } from "@/features/companies/hooks/useCompaniesPaginated";
import { useCompanyColumns } from "@/features/companies/hooks/useCompanyColumns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { CompanyPopup } from "@/features/companies/components/details/CompanyPopup";
import { CompanyForm } from "@/features/companies/components/form/CompanyForm";
import { DynamicCompanyTable } from "@/features/companies/components/table/DynamicCompanyTable";
import { ColumnConfigDialog } from "@/features/companies/components/table/ColumnConfigDialog";
import { Pagination } from "@/features/companies/components/table/Pagination";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

export function CompaniesPage() {
    const [search, setSearch] = useState("");
    const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [companyToEdit, setCompanyToEdit] = useState<any | null>(null);

    // Debounce da busca para otimizar performance
    const debouncedSearch = useDebounce(search, 500);

    // Hook paginado com busca otimizada
    const {
        companies,
        pagination,
        isLoading,
        isFetching,
        currentSearch,
        currentPageSize,
        goToPage,
        nextPage,
        previousPage,
        changePageSize,
        setSearch: setPaginatedSearch,
        createCompany,
        updateCompany,
        deleteCompany,
        refreshCompanies,
    } = useCompaniesPaginated({
        page: 1,
        pageSize: 10,
        search: "",
    });

    // Hook de configuração de colunas
    const { columns, visibleColumns, reorderColumns, resetToDefault, toggleColumnVisibility, updateColumn } = useCompanyColumns();

    // Sincronizar busca com debounce
    useEffect(() => {
        setPaginatedSearch(debouncedSearch);
    }, [debouncedSearch, setPaginatedSearch]);

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
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Cabeçalho fixo */}
            <div className="flex-shrink-0 p-4 border-b bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
                </div>

                {/* Barra de pesquisa e configuração */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 max-w-md relative">
                        <Input
                            placeholder="Buscar empresas... (mínimo 4 caracteres)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="rounded-full pr-10"
                        />
                        {search.length > 0 && search.length < 4 && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                    {4 - search.length} mais
                                </span>
                            </div>
                        )}
                        {search.length >= 4 && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                    Buscando...
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <ColumnConfigDialog
                            columns={columns}
                            onColumnsChange={reorderColumns}
                            onToggle={toggleColumnVisibility}
                            onReset={resetToDefault}
                        />
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
            </div>

            {/* Área principal da tabela */}
            <div className="flex-1 flex flex-col min-h-0 p-4 bg-gray-50/50">
                {/* Container da tabela */}
                <div className="flex-1 flex flex-col min-h-0 bg-white rounded-lg border shadow-sm overflow-hidden">
                    {/* Tabela Dinâmica */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <DynamicCompanyTable
                            companies={companies}
                            isLoading={isLoading || isFetching}
                            visibleColumns={visibleColumns}
                            onDelete={handleDelete}
                            onRowClick={setSelectedCompany}
                            onUpdateColumn={updateColumn}
                        />
                    </div>

                    {/* Paginação fixa na parte inferior */}
                    <div className="flex-shrink-0 border-t bg-white p-2">
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            pageSize={pagination.pageSize}
                            totalCount={pagination.totalCount}
                            hasNextPage={pagination.hasNextPage}
                            hasPreviousPage={pagination.hasPreviousPage}
                            onPageChange={goToPage}
                            onPageSizeChange={changePageSize}
                            isLoading={isLoading || isFetching}
                            pageSizeOptions={[10, 20, 50]}
                        />
                    </div>
                </div>
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

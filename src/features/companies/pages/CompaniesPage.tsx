import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompanyTable } from "@/features/companies/components/CompanyTable";
import { CompanyForm } from "@/features/companies/components/form/CompanyForm";
import { CompanyPopup } from "@/features/companies/components/CompanyPopup";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { Database } from "@/types/supabase";

type Company = Database["public"]["Tables"]["companies"]["Row"];

export function CompaniesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { companies, isLoading, deleteCompany } = useCompanies({ search });
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleDelete = async (company: Company) => {
    try {
      await deleteCompany(company.id);
    } catch (error) {
      console.error("Error deleting company:", error);
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as empresas cadastradas no seu CRM
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por nome, razão social, CNPJ, email ou WhatsApp"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xl pl-8"
        />
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>

      <CompanyTable
        companies={companies || []}
        onEdit={(company) => {
          setSelectedCompany(company);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        onViewDetails={(company) => {
          setSelectedCompany(company);
          setShowDetails(true);
        }}
      />

      <CompanyForm
        open={showForm}
        onOpenChange={setShowForm}
        company={selectedCompany}
        onSuccess={() => {
          setSelectedCompany(null);
          setShowForm(false);
        }}
      />

      {selectedCompany && (
        <CompanyPopup
          open={showDetails}
          onOpenChange={(open) => {
            setShowDetails(open);
            if (!open) setSelectedCompany(null);
          }}
          company={selectedCompany}
        />
      )}
    </div>
  );
}

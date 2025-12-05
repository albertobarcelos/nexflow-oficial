import { useOrganizationCompanies } from "@/hooks/useOrganizationCompanies";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CompaniesTab() {
  const { data: companies, isLoading, error } = useOrganizationCompanies();

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
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Nenhuma empresa encontrada</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome/Razão Social</TableHead>
            <TableHead>CPF/CNPJ</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Cidade/Estado</TableHead>
            <TableHead>Status</TableHead>
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
                <span className={`text-xs px-2 py-1 rounded-full ${
                  company.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {company.status === "active" ? "Ativo" : "Inativo"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


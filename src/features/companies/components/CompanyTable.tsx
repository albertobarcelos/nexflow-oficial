import { useState } from "react";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { Database } from "@/types/supabase";
import { formatCNPJ, formatPhone } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CompanyPopup } from "./CompanyPopup";
import { CompanyForm } from "./form/CompanyForm";
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
import { Building2, Mail, Phone, MapPin, Pencil, Trash2, Map, Instagram, Eye } from "lucide-react";

type Company = Database["public"]["Tables"]["companies"]["Row"];

interface CompanyTableProps {
  companies: Company[];
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onViewDetails: (company: Company) => void;
}

export function CompanyTable({ companies, onEdit, onDelete, onViewDetails }: CompanyTableProps) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const { deleteCompany } = useCompanies();

  const handleDelete = async () => {
    if (!companyToDelete) return;

    try {
      await deleteCompany.mutateAsync(companyToDelete.id);
      setCompanyToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir empresa:", error);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Logo</TableHead>
              <TableHead className="min-w-[200px]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Empresa
                </div>
              </TableHead>
              <TableHead className="min-w-[150px]">CNPJ</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[200px]">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contato
                </div>
              </TableHead>
              <TableHead className="min-w-[200px]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Localização
                </div>
              </TableHead>
              <TableHead className="w-[100px]"></TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow
                key={company.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={(e) => {
                  // Não abrir popup se clicou nos botões de ação
                  if ((e.target as HTMLElement).closest('.action-buttons')) return;
                  setSelectedCompany(company);
                }}
              >
                <TableCell>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{company.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {company.razao_social}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {company.cnpj ? formatCNPJ(company.cnpj) : "Não informado"}
                </TableCell>
                <TableCell>
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    {company.status || "Ativo"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
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
                    {company.instagram && (
                      <div className="flex items-center gap-2 text-sm">
                        <Instagram className="w-3 h-3" />
                        {company.instagram}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {company.city?.name || "Cidade não informada"}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Map className="w-3 h-3" />
                        {company.state?.name || "Estado não informado"}
                      </div>
                    </div>
                    {company.bairro && (
                      <div className="text-sm text-muted-foreground">
                        {company.bairro}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewDetails(company)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(company)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCompanyToDelete(company)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CompanyPopup
        open={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
        company={selectedCompany}
      />

      <CompanyForm
        open={!!companyToEdit}
        onOpenChange={(open) => !open && setCompanyToEdit(null)}
        company={companyToEdit}
      />

      <AlertDialog open={!!companyToDelete} onOpenChange={() => setCompanyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa {companyToDelete?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

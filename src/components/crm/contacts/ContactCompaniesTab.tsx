import { useState } from "react";
import { useContactCompanies } from "@/hooks/useContactCompanies";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Edit2, Building2, Loader2 } from "lucide-react";
import { CompanySelect } from "@/components/ui/company-select";
import { toast } from "sonner";

interface ContactCompaniesTabProps {
  contactId: string | null;
}

export function ContactCompaniesTab({ contactId }: ContactCompaniesTabProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    companies,
    isLoading,
    linkCompany,
    updateCompany,
    unlinkCompany,
    isLinking,
    isUpdating,
    isUnlinking,
  } = useContactCompanies(contactId);

  // Nota: O CompanySelect já filtra empresas disponíveis

  const handleLinkCompany = async () => {
    if (!selectedCompanyId) {
      toast.error("Selecione uma empresa");
      return;
    }

    try {
      await linkCompany({
        company_id: selectedCompanyId,
        role: role || null,
        is_primary: isPrimary,
      });
      setIsLinkDialogOpen(false);
      setSelectedCompanyId("");
      setRole("");
      setIsPrimary(false);
    } catch (error) {
      console.error("Erro ao vincular empresa:", error);
    }
  };

  const handleUpdateCompany = async (id: string, currentRole: string | null, currentIsPrimary: boolean) => {
    setEditingId(id);
    try {
      await updateCompany({
        id,
        role: currentRole || null,
        is_primary: currentIsPrimary,
      });
      setEditingId(null);
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      setEditingId(null);
    }
  };

  const handleUnlinkCompany = async (id: string, companyName: string) => {
    if (!confirm(`Tem certeza que deseja desvincular a empresa "${companyName}"?`)) {
      return;
    }

    try {
      await unlinkCompany(id);
    } catch (error) {
      console.error("Erro ao desvincular empresa:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Empresas Vinculadas</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as empresas associadas a este contato
          </p>
        </div>
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Vincular Empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vincular Empresa</DialogTitle>
              <DialogDescription>
                Selecione uma empresa para vincular a este contato
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <CompanySelect
                  value={selectedCompanyId}
                  onChange={(value) => setSelectedCompanyId(value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Cargo/Função (opcional)</Label>
                <Input
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Ex: Gerente, Diretor, etc."
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-primary"
                  checked={isPrimary}
                  onCheckedChange={(checked) => setIsPrimary(checked === true)}
                />
                <Label
                  htmlFor="is-primary"
                  className="text-sm font-normal cursor-pointer"
                >
                  Contato principal da empresa
                </Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsLinkDialogOpen(false);
                    setSelectedCompanyId("");
                    setRole("");
                    setIsPrimary(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleLinkCompany} disabled={isLinking || !selectedCompanyId}>
                  {isLinking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vinculando...
                    </>
                  ) : (
                    "Vincular"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Nenhuma empresa vinculada a este contato
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Cargo/Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((contactCompany) => {
              const company = contactCompany.company;
              if (!company) return null;

              return (
                <TableRow key={contactCompany.id}>
                  <TableCell className="font-medium">
                    {company.name}
                    {company.razao_social && company.razao_social !== company.name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {company.razao_social}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {company.cnpj || "-"}
                  </TableCell>
                  <TableCell>
                    {contactCompany.role || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contactCompany.is_primary ? (
                      <Badge variant="default">Principal</Badge>
                    ) : (
                      <Badge variant="secondary">Secundário</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleUpdateCompany(
                            contactCompany.id,
                            contactCompany.role,
                            !contactCompany.is_primary
                          )
                        }
                        disabled={editingId === contactCompany.id || isUpdating}
                      >
                        {editingId === contactCompany.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : contactCompany.is_primary ? (
                          "Remover Principal"
                        ) : (
                          "Tornar Principal"
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleUnlinkCompany(contactCompany.id, company.name)
                        }
                        disabled={isUnlinking}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}


import { useState } from "react";
import { useCompanyRelations, type CompanyRelation } from "@/hooks/useCompanyRelations";
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
import { Input } from "@/components/ui/input";
import { Loader2, Building2, Users, Handshake, Search, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CompanyRelationsTableProps {}

export function CompanyRelationsTable() {
  const { companies, isLoading } = useCompanyRelations();
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<CompanyRelation | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(search.toLowerCase()) ||
    company.cnpj?.toLowerCase().includes(search.toLowerCase()) ||
    company.razao_social?.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewDetails = (company: CompanyRelation) => {
    setSelectedCompany(company);
    setIsDetailsDialogOpen(true);
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
      {/* Barra de pesquisa */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ ou razão social..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Parceiros</TableHead>
              <TableHead>Contatos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {search ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies.map((company) => (
                <TableRow
                  key={company.id}
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{company.name}</span>
                      {company.razao_social && company.razao_social !== company.name && (
                        <span className="text-xs text-muted-foreground">
                          {company.razao_social}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {company.cnpj || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Handshake className="h-4 w-4 text-muted-foreground" />
                      <Badge variant={company.partnersCount > 0 ? "default" : "secondary"}>
                        {company.partnersCount}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Badge variant={company.contactsCount > 0 ? "default" : "secondary"}>
                        {company.contactsCount}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(company)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-muted-foreground">
        Exibindo {filteredCompanies.length} de {companies.length} empresas
      </div>

      {/* Dialog de detalhes */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCompany?.name}</DialogTitle>
            <DialogDescription>
              Relações de parceiros e contatos vinculados a esta empresa
            </DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-6 mt-4">
              {/* Informações da empresa */}
              <div className="space-y-2">
                <h3 className="font-semibold">Informações da Empresa</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">CNPJ:</span>{" "}
                    {selectedCompany.cnpj || "-"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Razão Social:</span>{" "}
                    {selectedCompany.razao_social || "-"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {selectedCompany.email || "-"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Telefone:</span>{" "}
                    {selectedCompany.phone || "-"}
                  </div>
                </div>
              </div>

              {/* Parceiros */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Handshake className="h-4 w-4" />
                  Parceiros ({selectedCompany.partners.length})
                </h3>
                {selectedCompany.partners.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum parceiro vinculado</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCompany.partners.map((partner) => (
                      <div
                        key={partner.id}
                        className="p-3 border rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{partner.partner.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {partner.partner.email}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge>{partner.partner.partner_type}</Badge>
                            <Badge variant="outline">{partner.partner.status}</Badge>
                          </div>
                        </div>
                        {partner.relationship_type && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Tipo de relação: {partner.relationship_type}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contatos */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Contatos ({selectedCompany.contacts.length})
                </h3>
                {selectedCompany.contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum contato vinculado</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCompany.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-3 border rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{contact.contact.client_name}</p>
                            {contact.contact.main_contact && (
                              <p className="text-sm text-muted-foreground">
                                {contact.contact.main_contact}
                              </p>
                            )}
                            {contact.contact.phone_numbers && contact.contact.phone_numbers.length > 0 && (
                              <p className="text-sm text-muted-foreground">
                                {contact.contact.phone_numbers[0]}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {contact.role && (
                              <Badge variant="secondary">{contact.role}</Badge>
                            )}
                            {contact.is_primary && (
                              <Badge>Principal</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



import { useState } from "react";
import { usePartnersWithContacts } from "@/hooks/usePartnersWithContacts";
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
import { Loader2, Handshake, Users, Search, Eye, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPhoneNumber } from "@/lib/utils/format";
import ReactToyFace from "react-toy-face";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function PartnersWithContactsList() {
  const navigate = useNavigate();
  const { partners, isLoading } = usePartnersWithContacts();
  const [search, setSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const filteredPartners = partners.filter(
    (partner) =>
      partner.name.toLowerCase().includes(search.toLowerCase()) ||
      partner.email?.toLowerCase().includes(search.toLowerCase()) ||
      partner.whatsapp?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedPartnerData = partners.find((p) => p.id === selectedPartner);

  const getPartnerTypeLabel = (type: string) => {
    const types = {
      AFILIADO: { label: "Afiliado", class: "bg-blue-500" },
      AGENTE_STONE: { label: "Agente Stone", class: "bg-green-500" },
      CONTADOR: { label: "Contador", class: "bg-purple-500" },
    };
    return types[type as keyof typeof types] || { label: type, class: "bg-gray-500" };
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDENTE: "bg-yellow-500",
      ATIVO: "bg-green-500",
      INATIVO: "bg-gray-500",
      BLOQUEADO: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const handleViewDetails = (partnerId: string) => {
    setSelectedPartner(partnerId);
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
            placeholder="Buscar por nome, email ou whatsapp..."
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
              <TableHead>Parceiro</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Contatos Indicados</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPartners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Handshake className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {search
                        ? "Nenhum parceiro encontrado"
                        : "Nenhum parceiro com contatos indicados"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPartners.map((partner) => (
                <TableRow key={partner.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <div className="w-full h-full">
                          {partner.avatar_seed ? (
                            <ReactToyFace
                              size={40}
                              toyNumber={Number(partner.avatar_seed.split("|")[0])}
                              group={Number(partner.avatar_seed.split("|")[1])}
                            />
                          ) : (
                            <ReactToyFace size={40} toyNumber={1} group={1} />
                          )}
                        </div>
                        <AvatarFallback>
                          {partner.name?.slice(0, 2).toUpperCase() || "P"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{partner.name}</p>
                        <p className="text-sm text-muted-foreground">{partner.email || "-"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPartnerTypeLabel(partner.partner_type).class}>
                      {getPartnerTypeLabel(partner.partner_type).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(partner.status)}>
                      {partner.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{partner.email}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatPhoneNumber(partner.whatsapp)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="default">{partner.contactsCount}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(partner.id)}
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
        Exibindo {filteredPartners.length} de {partners.length} parceiros com contatos
      </div>

      {/* Dialog de detalhes */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPartnerData?.name}</DialogTitle>
            <DialogDescription>
              Contatos indicados por este parceiro
            </DialogDescription>
          </DialogHeader>
          {selectedPartnerData && (
            <div className="space-y-6 mt-4">
              {/* Informações do parceiro */}
              <div className="space-y-2">
                <h3 className="font-semibold">Informações do Parceiro</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span> {selectedPartnerData.email}
                  </div>
                  <div>
                    <span className="text-muted-foreground">WhatsApp:</span>{" "}
                    {formatPhoneNumber(selectedPartnerData.whatsapp)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>{" "}
                    {getPartnerTypeLabel(selectedPartnerData.partner_type).label}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span> {selectedPartnerData.status}
                  </div>
                </div>
              </div>

              {/* Contatos indicados */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Contatos Indicados ({selectedPartnerData.contacts.length})
                </h3>
                {selectedPartnerData.contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum contato indicado por este parceiro
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedPartnerData.contacts.map((contact) => (
                      <div key={contact.id} className="p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{contact.client_name}</p>
                            {contact.email && (
                              <p className="text-sm text-muted-foreground">{contact.email}</p>
                            )}
                            {contact.phone_numbers && contact.phone_numbers.length > 0 && (
                              <p className="text-sm text-muted-foreground">
                                {contact.phone_numbers[0]}
                              </p>
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


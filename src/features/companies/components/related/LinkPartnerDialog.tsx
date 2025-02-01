import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePartners } from "@/hooks/usePartners";
import { Partner } from "@/types/database/partner";
import { Search, Plus } from "lucide-react";
import { AddPartnerDialog } from "@/components/crm/partners/AddPartnerDialog";
import { toast } from "sonner";
import { useCompanyRelationships } from "@/features/companies/hooks/useCompanyRelationships";

interface LinkPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onLink: (partner: Partner) => void;
}

export function LinkPartnerDialog({ open, onOpenChange, companyId, onLink }: LinkPartnerDialogProps) {
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { partners } = usePartners();
  const { companyPartners } = useCompanyRelationships(companyId);

  // Ids dos parceiros já vinculados
  const linkedPartnerIds = companyPartners?.map(cp => cp.partner.id) || [];

  // Filtrar parceiros que não estão vinculados à empresa atual
  const filteredPartners = partners?.filter((partner) => {
    const matchesSearch =
      partner.name?.toLowerCase().includes(search.toLowerCase()) ||
      partner.email?.toLowerCase().includes(search.toLowerCase()) ||
      partner.whatsapp?.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const handleLinkPartner = async (partner: Partner) => {
    onLink(partner);
    onOpenChange(false);
    toast.success("Parceiro adicionado com sucesso!");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vincular Parceiro</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Barra de pesquisa */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar parceiros..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                onClick={() => {
                  setIsAddDialogOpen(true);
                  onOpenChange(false);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Parceiro
              </Button>
            </div>

            {/* Lista de parceiros */}
            <div className="border rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium">Nome</th>
                      <th className="py-3 px-4 text-left font-medium">Tipo</th>
                      <th className="py-3 px-4 text-left font-medium">Email</th>
                      <th className="py-3 px-4 text-left font-medium">WhatsApp</th>
                      <th className="py-3 px-4 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartners?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-3 px-4 text-center text-muted-foreground">
                          Nenhum parceiro encontrado
                        </td>
                      </tr>
                    ) : (
                      filteredPartners?.map((partner) => (
                        <tr key={partner.id} className="border-b">
                          <td className="py-3 px-4">{partner.name}</td>
                          <td className="py-3 px-4">{partner.partner_type}</td>
                          <td className="py-3 px-4">{partner.email}</td>
                          <td className="py-3 px-4">{partner.whatsapp}</td>
                          <td className="py-3 px-4 text-right">
                            {linkedPartnerIds.includes(partner.id) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="text-muted-foreground"
                              >
                                Vinculado
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLinkPartner(partner)}
                              >
                                Vincular
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddPartnerDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) onOpenChange(true);
        }}
      />
    </>
  );
}

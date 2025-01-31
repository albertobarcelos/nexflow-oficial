import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MoreHorizontal, Plus, Download, Import, Star, Trophy, Medal } from "lucide-react";
import { usePartners } from "@/hooks/usePartners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ReactToyFace from "react-toy-face";
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
import { Partner } from "@/types/partner";
import { PartnerPopup } from "@/components/crm/partners/PartnerPopup";
import { EditPartnerDialog } from "./EditPartnerDialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatPhoneNumber } from "@/lib/utils/format";

const getAvatarUrl = (partner: Partner) => {
  if (!partner.avatar_seed) return '';
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${partner.avatar_seed}`;
};

export function PartnersPage() {
  const navigate = useNavigate();
  const { partners, isLoading, deletePartner } = usePartners();
  const [search, setSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [partnerToEdit, setPartnerToEdit] = useState<Partner | null>(null);

  const filteredPartners = partners?.filter((partner) =>
    partner.name.toLowerCase().includes(search.toLowerCase()) ||
    partner.email?.toLowerCase().includes(search.toLowerCase()) ||
    partner.whatsapp?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (e: React.MouseEvent, partner: Partner) => {
    e.stopPropagation();
    setPartnerToEdit(partner);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (partner: Partner) => {
    setIsDeleting(true);
    try {
      await deletePartner(partner.id);
      setPartnerToDelete(null);
      toast.success("Parceiro excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir parceiro:", error);
      toast.error("Erro ao excluir parceiro");
    } finally {
      setIsDeleting(false);
    }
  };

  const getPartnerTypeLabel = (type: string) => {
    const types = {
      AFILIADO: { label: "Afiliado", class: "bg-blue-500" },
      AGENTE_STONE: { label: "Agente Stone", class: "bg-green-500" },
      CONTADOR: { label: "Contador", class: "bg-purple-500" }
    };
    return types[type as keyof typeof types] || { label: type, class: "bg-gray-500" };
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDENTE: "bg-yellow-500",
      ATIVO: "bg-green-500",
      INATIVO: "bg-gray-500",
      BLOQUEADO: "bg-red-500"
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const renderLevel = (level: number) => {
    return (
      <div className="flex items-center gap-1">
        <Trophy className="w-4 h-4 text-yellow-500" />
        <span>Nível {level}</span>
      </div>
    );
  };

  const renderPoints = (points: number) => {
    return (
      <div className="flex items-center gap-1">
        <Medal className="w-4 h-4 text-blue-500" />
        <span>{points} pontos</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Parceiros</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Import className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => navigate("/crm/partners/add")}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Parceiro
          </Button>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por nome, email ou whatsapp"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xl"
        />
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Foto</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Nome</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Contato</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Empresa</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Gamificação</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-3 px-4 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : filteredPartners?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-3 px-4 text-center text-muted-foreground">
                    Nenhum parceiro encontrado
                  </td>
                </tr>
              ) : (
                filteredPartners?.map((partner) => (
                  <tr 
                    key={partner.id} 
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedPartner(partner)}
                  >
                    <td className="py-3 px-4">
                      <Avatar className="w-10 h-10">
                        <div className="w-full h-full">
                          {partner.avatar_seed ? (
                            <ReactToyFace
                              size={40}
                              toyNumber={Number(partner.avatar_seed.split('|')[0])}
                              group={Number(partner.avatar_seed.split('|')[1])}
                            />
                          ) : (
                            <ReactToyFace
                              size={40}
                              toyNumber={1}
                              group={1}
                            />
                          )}
                        </div>
                        <AvatarFallback>{partner.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </td>
                    <td className="py-3 px-4">{partner.name}</td>
                    <td className="py-3 px-4">
                      <Badge className={getPartnerTypeLabel(partner.partner_type).class}>
                        {getPartnerTypeLabel(partner.partner_type).label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(partner.status)}>
                        {partner.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm">{partner.email}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatPhoneNumber(partner.whatsapp)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {partner.company_id ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span>{partner.company_name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {partner.company_razao_social && (
                              <p>{partner.company_razao_social}</p>
                            )}
                            {partner.company_cnpj && (
                              <p>CNPJ: {partner.company_cnpj}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sem empresa</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        {renderLevel(partner.current_level || 1)}
                        {renderPoints(partner.points || 0)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => handleEdit(e, partner)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPartnerToDelete(partner);
                          }}
                        >
                          Excluir
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
        Exibindo {filteredPartners?.length} de {partners?.length} parceiros
      </div>

      {/* Popups */}
      {selectedPartner && (
        <PartnerPopup
          partner={selectedPartner}
          open={!!selectedPartner}
          onClose={() => setSelectedPartner(null)}
        />
      )}

      {/* Diálogo de Edição */}
      {partnerToEdit && (
        <EditPartnerDialog
          partner={partnerToEdit}
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setPartnerToEdit(null);
          }}
        />
      )}

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog 
        open={!!partnerToDelete} 
        onOpenChange={() => !isDeleting && setPartnerToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir parceiro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o parceiro{" "}
              <span className="font-semibold">{partnerToDelete?.name}</span>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => partnerToDelete && handleDelete(partnerToDelete)}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir parceiro"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 

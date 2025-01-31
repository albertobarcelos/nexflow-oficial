import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  Calendar,
  Mail,
  Phone,
  Trophy,
  Medal,
  Linkedin,
  Instagram,
  ArrowUpRight,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { usePartners } from "@/hooks/usePartners";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EditPartnerDialog } from "./EditPartnerDialog";
import { useState } from "react";
import { formatPhoneNumber } from "@/lib/utils/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PartnerDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { partner, isLoading } = usePartners(id);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold">Parceiro não encontrado</h2>
        <p className="text-muted-foreground">
          O parceiro que você está procurando não existe ou foi removido.
        </p>
        <Button
          className="mt-4"
          onClick={() => navigate("/crm/partners")}
        >
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Navegação */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/crm/partners")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Detalhes do Parceiro</h1>
      </div>

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {partner.name}
            <Badge className={getPartnerTypeLabel(partner.partner_type).class}>
              {getPartnerTypeLabel(partner.partner_type).label}
            </Badge>
            <Badge className={getStatusColor(partner.status)}>
              {partner.status}
            </Badge>
          </h1>
          {partner.company && (
            <p className="text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {partner.company.name}
              {partner.role && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  {partner.role}
                </>
              )}
            </p>
          )}
        </div>
        <Button onClick={() => setIsEditDialogOpen(true)}>
          Editar Parceiro
        </Button>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-3 gap-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
            <CardDescription>Informações básicas do parceiro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {partner.birth_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  {format(new Date(partner.birth_date), "PPP", { locale: ptBR })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a href={`mailto:${partner.email}`} className="hover:underline">
                {partner.email}
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <a href={`https://wa.me/${partner.whatsapp}`} className="hover:underline">
                {formatPhoneNumber(partner.whatsapp)}
              </a>
            </div>
            {partner.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{formatPhoneNumber(partner.phone)}</span>
              </div>
            )}
            {partner.linkedin && (
              <div className="flex items-center gap-2 text-sm">
                <Linkedin className="w-4 h-4 text-muted-foreground" />
                <a
                  href={partner.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  LinkedIn
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            )}
            {partner.instagram && (
              <div className="flex items-center gap-2 text-sm">
                <Instagram className="w-4 h-4 text-muted-foreground" />
                <a
                  href={`https://instagram.com/${partner.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  {partner.instagram}
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gamificação */}
        <Card>
          <CardHeader>
            <CardTitle>Gamificação</CardTitle>
            <CardDescription>Nível e conquistas do parceiro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div className="space-y-1">
                  <div className="text-sm font-medium">Nível</div>
                  <div className="text-2xl font-bold">{partner.current_level || 1}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Medal className="w-5 h-5 text-blue-500" />
                <div className="space-y-1">
                  <div className="text-sm font-medium">Pontos</div>
                  <div className="text-2xl font-bold">{partner.points || 0}</div>
                </div>
              </div>
            </div>
            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>Total de Indicações</span>
                </div>
                <span className="font-medium">{partner.total_indications || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Última Indicação</span>
                </div>
                <span className="font-medium">
                  {partner.last_indication_at
                    ? format(new Date(partner.last_indication_at), "dd/MM/yyyy")
                    : "Nenhuma"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
            <CardDescription>Notas e informações adicionais</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {partner.notes || "Nenhuma observação registrada."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Indicações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Indicações</CardTitle>
          <CardDescription>Empresas indicadas por este parceiro</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Data da Indicação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data da Conversão</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partner.indications?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma indicação registrada
                  </TableCell>
                </TableRow>
              ) : (
                partner.indications?.map((indication) => (
                  <TableRow key={indication.id}>
                    <TableCell className="font-medium">
                      {indication.company.name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(indication.indication_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {indication.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {indication.conversion_date
                        ? format(new Date(indication.conversion_date), "dd/MM/yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {indication.points_earned || 0}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de Edição */}
      {isEditDialogOpen && (
        <EditPartnerDialog
          partner={partner}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </div>
  );
} 

import { useState } from "react";
import { Handshake, Plus, Search, Filter, MoreHorizontal, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Dados mockados para exemplo
const partners = [
  {
    id: 1,
    name: "Consultoria XYZ",
    logo: "https://ui-avatars.com/api/?name=XYZ",
    type: "Consultoria",
    region: "São Paulo, SP",
    status: "Ativo",
    lastDeal: "2024-02-20",
    performance: "Alta",
    deals: 12,
  },
  {
    id: 2,
    name: "ABC Tecnologia",
    logo: "https://ui-avatars.com/api/?name=ABC",
    type: "Revenda",
    region: "Rio de Janeiro, RJ",
    status: "Em Pausa",
    lastDeal: "2024-02-18",
    performance: "Média",
    deals: 8,
  },
  // Adicione mais parceiros conforme necessário
];

export default function PartnersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parceiros</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe todos os parceiros cadastrados
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Parceiro
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar parceiros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parceiro</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Região</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>Negócios Fechados</TableHead>
              <TableHead>Último Negócio</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={partner.logo} alt={partner.name} />
                      <AvatarFallback>
                        <Handshake className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{partner.name}</span>
                  </div>
                </TableCell>
                <TableCell>{partner.type}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{partner.region}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={partner.status === "Ativo" ? "default" : "secondary"}
                  >
                    {partner.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      partner.performance === "Alta"
                        ? "success"
                        : partner.performance === "Média"
                        ? "warning"
                        : "destructive"
                    }
                  >
                    {partner.performance}
                  </Badge>
                </TableCell>
                <TableCell>{partner.deals}</TableCell>
                <TableCell>
                  {new Date(partner.lastDeal).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Ver histórico</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 

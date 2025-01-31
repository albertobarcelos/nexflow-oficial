import { useState } from "react";
import { User, Plus, Search, Filter, MoreHorizontal, Building2 } from "lucide-react";
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
const contacts = [
  {
    id: 1,
    name: "Ricardo Oliveira",
    avatar: "https://ui-avatars.com/api/?name=RO",
    email: "ricardo@techcorp.com",
    phone: "(11) 99999-9999",
    company: {
      name: "TechCorp Solutions",
      logo: "https://ui-avatars.com/api/?name=TechCorp",
    },
    position: "CEO",
    status: "Ativo",
    lastContact: "2024-02-20",
  },
  {
    id: 2,
    name: "Ana Paula Silva",
    avatar: "https://ui-avatars.com/api/?name=AS",
    email: "ana@inovare.com",
    phone: "(11) 98888-8888",
    company: {
      name: "Inovare Industries",
      logo: "https://ui-avatars.com/api/?name=Inovare",
    },
    position: "Diretora Comercial",
    status: "Em Pausa",
    lastContact: "2024-02-18",
  },
  // Adicione mais contatos conforme necessário
];

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pessoas</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe todos os contatos cadastrados
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar contatos..."
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
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Contato</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contact.avatar} alt={contact.name} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{contact.name}</span>
                  </div>
                </TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={contact.company.logo}
                        alt={contact.company.name}
                      />
                      <AvatarFallback>
                        <Building2 className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{contact.company.name}</span>
                  </div>
                </TableCell>
                <TableCell>{contact.position}</TableCell>
                <TableCell>
                  <Badge
                    variant={contact.status === "Ativo" ? "default" : "secondary"}
                  >
                    {contact.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(contact.lastContact).toLocaleDateString("pt-BR")}
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

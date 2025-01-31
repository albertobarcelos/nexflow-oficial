import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Contact as ContactIcon, MoreHorizontal, Plus } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { AddContactDialog } from "@/components/crm/entities/contacts/AddContactDialog";
import { EditContactDialog } from "@/components/crm/entities/contacts/EditContactDialog";
import { ContactCustomFields } from "@/components/crm/entities/contacts/ContactCustomFields";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function ContactsPage() {
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    cpf?: string;
    description?: string;
  } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = useState(false);

  const { contacts, isLoading, deleteContact } = useContacts();

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este contato?")) {
      await deleteContact(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Contatos</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os contatos cadastrados no sistema.
            </p>
          </div>
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Contatos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os contatos cadastrados no sistema.
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts?.map((contact) => (
              <TableRow
                key={contact.id}
                className="cursor-pointer"
                onClick={() => navigate(`/crm/entities/contacts/${contact.id}`)}
              >
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>{contact.cpf}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedContact(contact);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedContact(contact);
                          setIsCustomFieldsOpen(true);
                        }}
                      >
                        Campos Customizados
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(contact.id);
                        }}
                        className="text-destructive"
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {contacts?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                    <ContactIcon className="h-8 w-8" />
                    <p>Nenhum contato cadastrado</p>
                    <p>Clique em "Novo Contato" para começar</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddContactDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {selectedContact && (
        <>
          <EditContactDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            contactId={selectedContact.id}
            initialData={{
              name: selectedContact.name,
              email: selectedContact.email,
              phone: selectedContact.phone,
              cpf: selectedContact.cpf,
              description: selectedContact.description,
            }}
          />

          <Sheet open={isCustomFieldsOpen} onOpenChange={setIsCustomFieldsOpen}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Campos Customizados</SheetTitle>
                <SheetDescription>
                  Gerencie os campos customizados do contato {selectedContact.name}.
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-full py-4">
                <ContactCustomFields
                  contactId={selectedContact.id}
                  onSave={() => setIsCustomFieldsOpen(false)}
                />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
} 

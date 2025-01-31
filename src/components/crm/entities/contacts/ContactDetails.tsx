import { Contact } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { ContactCustomFields } from "./ContactCustomFields";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ContactDetailsProps {
  contactId: string;
}

export function ContactDetails({ contactId }: ContactDetailsProps) {
  const { contacts, isLoading } = useContacts();
  const contact = contacts?.find((c) => c.id === contactId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-[200px]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[300px]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-[200px]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-md border">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Contact className="h-8 w-8" />
          <p>Contato não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">E-mail</p>
            <p className="text-sm text-muted-foreground">
              {contact.email || "Não informado"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Telefone</p>
            <p className="text-sm text-muted-foreground">
              {contact.phone || "Não informado"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">CPF</p>
            <p className="text-sm text-muted-foreground">
              {contact.cpf || "Não informado"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Descrição</p>
            <p className="text-sm text-muted-foreground">
              {contact.description || "Não informado"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campos Customizados</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactCustomFields contactId={contact.id} />
        </CardContent>
      </Card>
    </div>
  );
} 

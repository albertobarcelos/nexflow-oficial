import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClientAccessGuard } from "@/hooks/useClientAccessGuard";
import { useContactDetails } from "@/hooks/useContactDetails";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, User, Building2, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ContactDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    hasAccess,
    accessError,
    currentClient,
    isLoading: isGuardLoading,
  } = useClientAccessGuard();
  const hasLoggedAudit = useRef(false);

  const { data: details, isLoading, error } = useContactDetails(id);

  useEffect(() => {
    if (hasAccess && currentClient?.id && id && !hasLoggedAudit.current) {
      console.info(
        "[AUDIT] Contato",
        id,
        "- Client:",
        currentClient.id,
        currentClient.name ?? ""
      );
      hasLoggedAudit.current = true;
    }
  }, [hasAccess, currentClient?.id, currentClient?.name, id]);

  if (isGuardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>
            {accessError ??
              "Cliente não definido. Não é possível acessar este contato."}
          </AlertDescription>
        </Alert>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-4">
        <Alert variant="destructive">
          <AlertDescription>Erro ao carregar contato: {error.message}</AlertDescription>
        </Alert>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="p-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Alert>
          <AlertDescription>Contato não encontrado ou sem acesso.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">{details.client_name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Nome principal:</span>
              <span className="ml-2">{details.main_contact || "—"}</span>
            </div>
            {details.phone_numbers?.length ? (
              <div>
                <span className="font-medium flex items-center gap-1">
                  <Phone className="h-4 w-4" /> Telefones:
                </span>
                <span className="ml-2">
                  {details.phone_numbers.join(", ")}
                </span>
              </div>
            ) : null}
            {details.company_names?.length ? (
              <div>
                <span className="font-medium flex items-center gap-1">
                  <Building2 className="h-4 w-4" /> Empresas:
                </span>
                <span className="ml-2">
                  {details.company_names.join(", ")}
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {details.linkedCards && details.linkedCards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cards vinculados</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {details.linkedCards.map((card) => (
                  <li key={card.id}>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() =>
                        navigate(`/crm/flows/${card.flowId}/board`)
                      }
                    >
                      {card.title}
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

import { useIndications } from "@/hooks/useIndications";
import { IndicationCard } from "./IndicationCard";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Indication } from "@/types/indications";

interface IndicationsListProps {
  onIndicationClick?: (indication: Indication) => void;
  onIndicationCreateCard?: (indication: Indication) => void;
}

export function IndicationsList({ onIndicationClick, onIndicationCreateCard }: IndicationsListProps) {
  const { indications, isLoading, isError, error } = useIndications();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando indicações...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error 
            ? error.message 
            : "Erro ao carregar indicações. Tente novamente mais tarde."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!indications || indications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-muted-foreground">
            Nenhuma indicação encontrada
          </p>
          <p className="text-sm text-muted-foreground">
            As indicações aparecerão aqui quando forem criadas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {indications.map((indication, index) => (
        <IndicationCard
          key={indication.id}
          indication={indication}
          index={index}
          onClick={onIndicationClick ? () => onIndicationClick(indication) : undefined}
          onCreateCard={onIndicationCreateCard ? () => onIndicationCreateCard(indication) : undefined}
        />
      ))}
    </div>
  );
}


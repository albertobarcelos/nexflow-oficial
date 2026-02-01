import { PartnersWithContactsList } from "@/components/crm/partners/PartnersWithContactsList";
import { Handshake, Users } from "lucide-react";

export function PartnersListPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Handshake className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Parceiros com Contatos
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Visualize parceiros que têm contatos indicados por eles
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <PartnersWithContactsList />
    </div>
  );
}



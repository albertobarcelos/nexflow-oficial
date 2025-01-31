import { useState } from "react";
import { useCompanyRelationships } from "@/features/companies/hooks/useCompanyRelationships";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddRelationshipDialog } from "./AddRelationshipDialog";
import { RelatedPeopleList } from "./RelatedPeopleList";
import { RelatedPartnersList } from "./RelatedPartnersList";

interface CompanyRelationshipsProps {
  companyId: string;
}

export function CompanyRelationships({ companyId }: CompanyRelationshipsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { isLoading } = useCompanyRelationships(companyId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Relacionamentos</h3>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>

      <Tabs defaultValue="people">
        <TabsList>
          <TabsTrigger value="people">Pessoas</TabsTrigger>
          <TabsTrigger value="partners">Parceiros</TabsTrigger>
        </TabsList>
        <TabsContent value="people">
          <RelatedPeopleList companyId={companyId} />
        </TabsContent>
        <TabsContent value="partners">
          <RelatedPartnersList companyId={companyId} />
        </TabsContent>
      </Tabs>

      <AddRelationshipDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        companyId={companyId}
      />
    </div>
  );
} 

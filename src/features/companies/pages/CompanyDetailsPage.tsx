import { useParams } from "react-router-dom";
import { useCompany } from "@/features/companies/hooks/useCompany";
import { CompanyDetails } from "@/features/companies/components/details/CompanyDetails";
import { CompanyCard } from "@/features/companies/components/list/CompanyCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyRelationships } from "@/features/companies/components/related/CompanyRelationships";
import { CompanyCustomFields } from "@/features/companies/components/custom-fields/CompanyCustomFields";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit } from "lucide-react";
import { useState } from "react";
import { CompanyForm } from "@/features/companies/components/form/CompanyForm";

export function CompanyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { company, isLoading, refetch } = useCompany(id!);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
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

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">Empresa não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{company.name}</h2>
          {company.type && (
            <p className="text-sm text-muted-foreground">{company.type.name}</p>
          )}
        </div>
        <Button onClick={() => setShowEditDialog(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          {company.email && (
            <p className="text-sm">
              <span className="font-medium">E-mail:</span> {company.email}
            </p>
          )}
          {company.phone && (
            <p className="text-sm">
              <span className="font-medium">Telefone:</span> {company.phone}
            </p>
          )}
          {company.website && (
            <p className="text-sm">
              <span className="font-medium">Website:</span>{" "}
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {company.website}
              </a>
            </p>
          )}
        </div>
        <div>
          {company.address && (
            <div className="text-sm">
              <p className="font-medium">Endereço:</p>
              <p>{company.address.street}</p>
              <p>
                {company.address.city}, {company.address.state}
              </p>
              <p>{company.address.postalCode}</p>
              <p>{company.address.country}</p>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="relationships">
        <TabsList>
          <TabsTrigger value="relationships">Relacionamentos</TabsTrigger>
          <TabsTrigger value="fields">Campos personalizados</TabsTrigger>
        </TabsList>
        <TabsContent value="relationships">
          <CompanyRelationships companyId={company.id} />
        </TabsContent>
        <TabsContent value="fields">
          <CompanyCustomFields companyId={company.id} />
        </TabsContent>
      </Tabs>

      <CompanyForm
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        company={company}
        onSuccess={() => {
          setShowEditDialog(false);
          refetch();
        }}
      />
    </div>
  );
}

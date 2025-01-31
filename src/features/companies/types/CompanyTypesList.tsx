import { useState } from "react";
import { useCompanyTypes } from "@/features/companies/hooks/useCompanyTypes";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompanyTypeDialog } from "./CompanyTypeDialog";
import { CompanyTypeCard } from "./CompanyTypeCard";
import { Skeleton } from "@/components/ui/skeleton";

export function CompanyTypesList() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { companyTypes, isLoading } = useCompanyTypes();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-[200px] mb-2" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tipos de Empresa</h2>
          <p className="text-muted-foreground">
            Gerencie os tipos de empresa disponíveis no sistema
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companyTypes.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum tipo cadastrado</CardTitle>
              <CardDescription>
                Clique no botão "Novo Tipo" para começar a cadastrar tipos de
                empresa.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          companyTypes.map((type) => (
            <CompanyTypeCard key={type.id} type={type} />
          ))
        )}
      </div>

      <CompanyTypeDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
} 

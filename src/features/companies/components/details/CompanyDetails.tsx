import { useState } from "react";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, Globe, MapPin, Users, DollarSign } from "lucide-react";
import { CompanyForm } from "@/features/companies/components/form/CompanyForm";
import { CompanyCustomFields } from "@/features/companies/components/custom-fields/CompanyCustomFields";
import { CompanyRelationships } from "@/features/companies/components/related/CompanyRelationships";
import { formatPhone, formatCNPJ } from "@/lib/format";

interface CompanyDetailsProps {
  companyId: string;
}

export function CompanyDetails({ companyId }: CompanyDetailsProps) {
  const { companies, isLoading } = useCompanies();
  const company = companies?.find((c) => c.id === companyId);

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

  if (!company) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-md border">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Building2 className="h-8 w-8" />
          <p>Empresa não encontrada</p>
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
            <p className="text-sm font-medium">CNPJ</p>
            <p className="text-sm text-muted-foreground">
              {company.cnpj || "Não informado"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Descrição</p>
            <p className="text-sm text-muted-foreground">
              {company.description || "Não informado"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campos Customizados</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyCustomFields companyId={company.id} />
        </CardContent>
      </Card>
    </div>
  );
} 

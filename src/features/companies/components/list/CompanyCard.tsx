import { useState } from "react";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MoreHorizontal, Phone, Mail, MapPin } from "lucide-react";
import { CompanyForm } from "@/features/companies/components/form/CompanyForm";
import { CompanyDetails } from "@/features/companies/components/details/CompanyDetails";
import { Badge } from "@/components/ui/badge";
import { formatPhone } from "@/lib/format";
import { Company } from "@/types/database/company";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CompanyCardProps {
  company: Company;
  onDelete?: () => void;
  onClick?: () => void;
}

export function CompanyCard({ company, onDelete, onClick }: CompanyCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  return (
    <>
      <Card
        className="relative overflow-hidden transition-all hover:border-primary/50"
        onClick={onClick}
      >
        <CardHeader className="space-y-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="line-clamp-1 text-base">{company.name}</CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setShowEditDialog(true);
                }}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                >
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {company.razao_social && (
            <CardDescription className="line-clamp-1 mt-1.5">
              {company.razao_social}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {company.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="line-clamp-1">{company.email}</span>
            </div>
          )}
          {company.telefone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{formatPhone(company.telefone)}</span>
            </div>
          )}
          {company.cidade && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="line-clamp-1">
                {company.cidade}
                {company.estado && `, ${company.estado}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <CompanyForm
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        company={company}
      />
    </>
  );
}

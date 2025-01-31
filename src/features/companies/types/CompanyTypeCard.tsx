import { useState } from "react";
import { useCompanyTypes } from "@/features/companies/hooks/useCompanyTypes";
import { CustomCompanyType } from "@/types/database/company";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { CompanyTypeDialog } from "./CompanyTypeDialog";
import { toast } from "sonner";

interface CompanyTypeCardProps {
  type: CustomCompanyType;
}

export function CompanyTypeCard({ type }: CompanyTypeCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { removeCompanyType } = useCompanyTypes();

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este tipo de empresa?"
    );
    if (confirmed) {
      try {
        await removeCompanyType.mutateAsync(type.id);
      } catch (error) {
        console.error("Erro ao excluir tipo:", error);
        toast.error("Erro ao excluir tipo de empresa");
      }
    }
  };

  return (
    <>
      <Card
        className="relative"
        style={
          type.color
            ? {
                borderLeftColor: type.color,
                borderLeftWidth: "4px",
              }
            : undefined
        }
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">{type.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleDelete}
              >
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {type.description && (
            <CardDescription>{type.description}</CardDescription>
          )}
        </CardContent>
      </Card>

      <CompanyTypeDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        type={type}
      />
    </>
  );
} 

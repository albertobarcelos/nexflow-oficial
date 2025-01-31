import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFields } from "@/hooks/useFields";
import { EditFieldDialog } from "./EditFieldDialog";
import { FieldValue } from "@/types/database/fields";

interface FieldValueCardProps {
  fieldValue: FieldValue;
  targetId: string;
}

export function FieldValueCard({ fieldValue, targetId }: FieldValueCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { deleteFieldValue } = useFields();

  const handleRemove = async () => {
    if (!confirm("Tem certeza que deseja remover este campo?")) return;

    try {
      await deleteFieldValue(fieldValue.id);
      toast.success("Campo removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover campo:", error);
      toast.error("Erro ao remover campo");
    }
  };

  const formatValue = (value: string, type: string) => {
    switch (type) {
      case "date":
        return new Date(value).toLocaleDateString();
      case "url":
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {value}
          </a>
        );
      default:
        return value;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">
              {fieldValue.field.name}
            </CardTitle>
            {fieldValue.field.description && (
              <CardDescription>{fieldValue.field.description}</CardDescription>
            )}
          </div>
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
              <DropdownMenuItem onClick={handleRemove} className="text-destructive">
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            {formatValue(fieldValue.value, fieldValue.field.type)}
          </div>
        </CardContent>
      </Card>

      <EditFieldDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        fieldValue={fieldValue}
        targetId={targetId}
      />
    </>
  );
} 

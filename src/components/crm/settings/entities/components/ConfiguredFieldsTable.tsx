import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EntityField } from "../types";
import { 
  TextIcon, 
  Hash, 
  Calendar, 
  CheckSquare, 
  List 
} from "lucide-react";

interface ConfiguredFieldsTableProps {
  fields: EntityField[];
}

const getFieldTypeIcon = (fieldType: string) => {
  switch (fieldType) {
    case 'text':
      return <TextIcon className="h-4 w-4" />;
    case 'number':
      return <Hash className="h-4 w-4" />;
    case 'date':
      return <Calendar className="h-4 w-4" />;
    case 'checkbox':
      return <CheckSquare className="h-4 w-4" />;
    case 'select':
      return <List className="h-4 w-4" />;
    default:
      return <TextIcon className="h-4 w-4" />;
  }
};

const getFieldTypeLabel = (fieldType: string) => {
  const labels: Record<string, string> = {
    text: 'Texto',
    number: 'Número',
    date: 'Data',
    checkbox: 'Checkbox',
    select: 'Lista',
  };
  return labels[fieldType] || fieldType;
};

export function ConfiguredFieldsTable({ fields }: ConfiguredFieldsTableProps) {
  if (!fields.length) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        Nenhum campo configurado ainda.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome do Campo</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Obrigatório</TableHead>
          <TableHead>Ordem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((field) => (
          <TableRow key={field.id}>
            <TableCell className="font-medium">{field.name}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getFieldTypeIcon(field.field_type)}
                <span>{getFieldTypeLabel(field.field_type)}</span>
              </div>
            </TableCell>
            <TableCell>
              {field.is_required ? (
                <Badge>Sim</Badge>
              ) : (
                <span className="text-muted-foreground">Não</span>
              )}
            </TableCell>
            <TableCell>{field.order_index + 1}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
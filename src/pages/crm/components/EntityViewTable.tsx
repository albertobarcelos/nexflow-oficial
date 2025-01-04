import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Entity } from "@/components/crm/settings/entities/types";

interface EntityViewTableProps {
  entityData: Entity;
  records: any[] | undefined;
}

export function EntityViewTable({ entityData, records }: EntityViewTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {entityData.fields.map((field) => (
              <TableHead key={field.id}>{field.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records?.map((record, index) => (
            <TableRow key={index}>
              {entityData.fields.map((field) => (
                <TableCell key={field.id}>
                  {record[field.name] || '-'}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {(!records || records.length === 0) && (
            <TableRow>
              <TableCell colSpan={entityData.fields.length} className="text-center text-muted-foreground">
                Nenhum registro encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
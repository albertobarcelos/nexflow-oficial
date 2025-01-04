import { useEffect } from 'react';
import { EntityListProps } from '../types';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export function EntityList({ entities, onEdit, onDelete }: EntityListProps) {
  useEffect(() => {
    console.log('Entities updated:', entities);
  }, [entities]);

  const handleEdit = (entity: any) => {
    console.log('Editing entity:', entity);
    if (onEdit) {
      onEdit({
        ...entity,
        fields: entity.entity_fields
      });
    }
  };

  const handleDelete = (entity: any) => {
    console.log('Deleting entity:', entity);
    if (onDelete) {
      onDelete(entity);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left">Nome</th>
              <th className="p-4 text-left">Campos</th>
              <th className="p-4 text-left">Criado em</th>
              <th className="p-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {entities?.map((entity) => (
              <tr key={entity.id} className="border-b">
                <td className="p-4">{entity.name}</td>
                <td className="p-4">{entity.entity_fields?.length || 0} campos</td>
                <td className="p-4">
                  {format(new Date(entity.created_at), 'dd/MM/yyyy')}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(entity)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(entity)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import { useEffect } from 'react';
import { EntityListProps } from '../types';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Database, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function EntityList({ entities, onEdit, onDelete }: EntityListProps) {
  useEffect(() => {
    console.log('Entities updated:', entities);
  }, [entities]);

  const handleEdit = (entity: any) => {
    console.log('Editing entity:', entity);
    if (onEdit) {
      onEdit({
        ...entity,
        fields: entity.entity_fields || entity.fields
      });
    }
  };

  const handleDelete = (entity: any) => {
    console.log('Deleting entity:', entity);
    if (onDelete) {
      onDelete(entity);
    }
  };

  const getFieldsCount = (entity: any) => {
    return entity.entity_fields?.length || entity.fields?.length || 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-primary">Entidades</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              className="hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Criar nova entidade personalizada
          </TooltipContent>
        </Tooltip>
      </div>

      <motion.div 
        className="rounded-md border bg-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left font-medium text-muted-foreground">Nome</th>
              <th className="p-4 text-left font-medium text-muted-foreground">Campos</th>
              <th className="p-4 text-left font-medium text-muted-foreground">Criado em</th>
              <th className="p-4 text-left font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {entities?.map((entity, index) => (
              <motion.tr 
                key={entity.id} 
                className="border-b hover:bg-muted/50 transition-colors group"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary/60" />
                    <span className="font-medium group-hover:text-primary transition-colors">
                      {entity.name}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant="secondary" className="font-normal">
                    {getFieldsCount(entity)} campos
                  </Badge>
                </td>
                <td className="p-4 text-muted-foreground">
                  {format(new Date(entity.created_at), 'dd/MM/yyyy')}
                </td>
                <td className="p-4">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(entity)}
                          className="h-8 w-8 hover:bg-primary/5"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar entidade</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(entity)}
                          className="h-8 w-8 hover:bg-destructive/5 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir entidade</TooltipContent>
                    </Tooltip>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
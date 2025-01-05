import { useEffect } from 'react';
import { EntityListProps } from '../types';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Users, Pencil, Copy, Trash2, Database } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

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

  const getEntityIcon = (name: string) => {
    if (name.toLowerCase().includes('empresa')) return Building2;
    if (name.toLowerCase().includes('contato')) return Users;
    return Database;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-primary">Entidades</h3>
          <Badge 
            variant="secondary" 
            className="text-xs font-normal bg-primary/10 text-primary hover:bg-primary/15"
          >
            {entities?.length || 0} total
          </Badge>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              className="gap-2 bg-primary hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Criar nova entidade personalizada
          </TooltipContent>
        </Tooltip>
      </div>

      <AnimatePresence>
        {(!entities || entities.length === 0) ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-muted/30 rounded-lg border border-dashed"
          >
            <Database className="h-12 w-12 text-muted-foreground/50" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Nenhuma entidade encontrada</h4>
              <p className="text-sm text-muted-foreground">
                Clique em "Nova" para começar a personalizar suas entidades
              </p>
            </div>
          </motion.div>
        ) : (
          <Card className="overflow-hidden border-primary/10">
            <div className="divide-y divide-border/50">
              {entities?.map((entity, index) => {
                const Icon = getEntityIcon(entity.name);
                const fieldsCount = getFieldsCount(entity);
                
                return (
                  <motion.div 
                    key={entity.id}
                    className={cn(
                      "p-4 transition-colors hover:bg-muted/50 group cursor-pointer",
                      "flex items-center justify-between gap-4"
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate group-hover:text-primary transition-colors">
                            {entity.name}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className="font-normal bg-muted"
                          >
                            {fieldsCount} {fieldsCount === 1 ? 'campo' : 'campos'}
                          </Badge>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm text-muted-foreground truncate">
                              Criado em {format(new Date(entity.created_at), "dd 'de' MMMM 'de' yyyy")}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            {format(new Date(entity.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm")}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

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
                            className="h-8 w-8 hover:bg-primary/5"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplicar entidade</TooltipContent>
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
                  </motion.div>
                );
              })}
            </div>
          </Card>
        )}
      </AnimatePresence>
    </div>
  );
}
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Type, Hash, Calendar, CheckSquare, List,
  LucideIcon
} from 'lucide-react';
import { Entity, EntityField } from '../types';
import { motion } from 'framer-motion';

const fieldTypeIcons: Record<string, LucideIcon> = {
  text: Type,
  number: Hash,
  date: Calendar,
  checkbox: CheckSquare,
  select: List,
};

interface EntityNodeProps {
  data: Entity;
}

const EntityNodeComponent = ({ data }: EntityNodeProps) => {
  const IconComponent = fieldTypeIcons[data.icon_name] || Type;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-[300px] shadow-lg border-2" style={{ borderColor: data.color }}>
        <Handle 
          type="target" 
          position={Position.Left} 
          className="w-3 h-3 bg-muted-foreground"
        />
        
        <div className="p-4 border-b flex items-center gap-3">
          <div className="p-2 rounded-full bg-muted" style={{ color: data.color }}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{data.name}</h3>
            {data.description && (
              <p className="text-sm text-muted-foreground">{data.description}</p>
            )}
          </div>
        </div>

        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>Campo</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.fields?.map((field: EntityField) => {
                const FieldIcon = fieldTypeIcons[field.field_type] || Type;
                return (
                  <TableRow key={field.id}>
                    <TableCell>
                      <FieldIcon className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="font-medium">
                      {field.name}
                      {field.is_required && <span className="text-destructive ml-1">*</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {field.field_type}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <Handle 
          type="source" 
          position={Position.Right} 
          className="w-3 h-3 bg-muted-foreground"
        />
      </Card>
    </motion.div>
  );
};

EntityNodeComponent.displayName = 'EntityNode';

export const EntityNode = memo(EntityNodeComponent);
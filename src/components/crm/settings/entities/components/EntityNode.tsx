import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Entity } from '../types';

interface EntityNodeProps {
  data: Entity;
}

export const EntityNode = memo(({ data }: EntityNodeProps) => {
  return (
    <Card className="w-[280px]">
      <Handle type="target" position={Position.Left} />
      <CardHeader>
        <CardTitle>{data.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.fields.map((field) => (
          <div key={field.id} className="flex items-center justify-between text-sm">
            <span>{field.name}</span>
            <span className="text-muted-foreground">{field.type}</span>
          </div>
        ))}
      </CardContent>
      <Handle type="source" position={Position.Right} />
    </Card>
  );
});

EntityNode.displayName = 'EntityNode';
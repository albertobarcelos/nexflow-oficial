import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Entity } from '../types';

interface EntityNodeProps {
  data: {
    entity: Entity;
    label?: string;
  };
}

function EntityNode({ data }: EntityNodeProps) {
  const { entity } = data;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md min-w-[200px]">
      <Handle type="target" position={Position.Top} />
      <div className="font-medium text-lg mb-2">{entity.name}</div>
      <div className="text-sm text-muted-foreground">{entity.description}</div>
      <div className="mt-2 space-y-1">
        {entity.fields?.map((field) => (
          <div key={field.id} className="text-sm">
            {field.name}
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(EntityNode);
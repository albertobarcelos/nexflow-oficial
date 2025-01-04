import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Entity } from '../types';

interface EntityNodeProps {
  data: Entity;
}

const EntityNode = ({ data }: EntityNodeProps) => {
  if (!data) {
    return null;
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md min-w-[200px]">
      <Handle type="target" position={Position.Top} />
      <div className="font-medium text-lg mb-2">{data.name}</div>
      <div className="text-sm text-muted-foreground">{data.description}</div>
      <div className="mt-2 space-y-1">
        {data.fields?.map((field) => (
          <div key={field.id} className="text-sm">
            {field.name}
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default memo(EntityNode);
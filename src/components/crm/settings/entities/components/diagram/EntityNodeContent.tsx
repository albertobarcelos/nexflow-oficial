import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Entity } from '../../types';

interface EntityNodeContentProps {
  data: Entity;
}

const EntityNodeContent = ({ data }: EntityNodeContentProps) => {
  if (!data) return null;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md min-w-[200px] max-w-[300px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      <div className="font-medium text-lg mb-2 text-gray-800">{data.name}</div>
      <div className="text-sm text-muted-foreground mb-3">{data.description}</div>
      <div className="space-y-1">
        {data.fields?.map((field) => (
          <div key={field.id} className="text-sm text-gray-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            {field.name}
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </div>
  );
};

export default memo(EntityNodeContent);
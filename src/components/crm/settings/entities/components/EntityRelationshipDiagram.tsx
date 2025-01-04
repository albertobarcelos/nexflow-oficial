import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  ConnectionMode,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { EntityNode } from './EntityNode';
import { useEntities } from '../hooks/useEntities';
import { cn } from '@/lib/utils';

const nodeTypes = {
  entity: EntityNode,
};

const defaultViewport = { x: 0, y: 0, zoom: 0.7 };

export function EntityRelationshipDiagram() {
  const { entities, relationships, isLoading } = useEntities();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onInit = useCallback(() => {
    if (!entities) return;

    // Transform entities into nodes with proper spacing
    const newNodes: Node[] = entities.map((entity, index) => ({
      id: entity.id,
      type: 'entity',
      position: { 
        x: (index % 3) * 350, 
        y: Math.floor(index / 3) * 250 
      },
      data: entity,
    }));

    // Transform relationships into edges with smooth curves
    const newEdges: Edge[] = relationships?.map((rel) => ({
      id: rel.id,
      source: rel.source_entity_id,
      target: rel.target_entity_id,
      label: rel.name,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#9E9E9E', strokeWidth: 2 },
    })) || [];

    setNodes(newNodes);
    setEdges(newEdges);
  }, [entities, relationships, setNodes, setEdges]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className={cn(
      "w-full h-[800px] rounded-lg overflow-hidden",
      "bg-[#F5F5F5] shadow-lg border border-border"
    )}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultViewport={defaultViewport}
        onInit={onInit}
        fitView
        className="font-inter"
      >
        <Background color="#9E9E9E" />
        <Controls 
          className="bg-background border border-border rounded-lg shadow-sm"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}
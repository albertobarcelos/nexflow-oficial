import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Connection,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EntityNode from './EntityNode';
import { EntityDiagramProps } from '../types';

const nodeTypes = {
  entity: EntityNode,
};

export function EntityDiagram({ entities, relationships }: EntityDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Transform entities into nodes
  useEffect(() => {
    if (!entities) return;

    const newNodes = entities.map((entity, index) => ({
      id: entity.id,
      type: 'entity',
      position: { x: 250 * index, y: 100 },
      data: entity,
      draggable: true,
    }));

    setNodes(newNodes);
  }, [entities, setNodes]);

  // Transform relationships into edges
  useEffect(() => {
    if (!relationships) return;

    const newEdges = relationships.map((rel) => ({
      id: rel.id,
      source: rel.source_entity_id,
      target: rel.target_entity_id,
      label: rel.name,
      type: 'smoothstep',
      animated: true,
    }));

    setEdges(newEdges);
  }, [relationships, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('New connection:', params);
    },
    []
  );

  return (
    <div className="h-[600px] border rounded-lg bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
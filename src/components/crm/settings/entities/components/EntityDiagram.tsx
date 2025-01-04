import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EntityNodeContent from './EntityNodeContent';
import { EntityDiagramProps } from '../types';

const nodeTypes = {
  entity: EntityNodeContent,
};

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const nodeWidth = 250;
  const nodeHeight = 200;
  const gapBetweenNodes = 100;

  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: direction === 'LR' ? index * (nodeWidth + gapBetweenNodes) : index * 100,
      y: direction === 'LR' ? 100 : index * (nodeHeight + gapBetweenNodes),
    },
  }));
};

export function EntityDiagram({ entities, relationships }: EntityDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!entities) return;

    const newNodes = entities.map((entity) => ({
      id: entity.id,
      type: 'entity',
      position: { x: 0, y: 0 },
      data: entity,
      draggable: true,
    }));

    const layoutedNodes = getLayoutedElements(newNodes, []);
    setNodes(layoutedNodes);
  }, [entities, setNodes]);

  useEffect(() => {
    if (!relationships) return;

    const newEdges = relationships.map((rel) => ({
      id: rel.id,
      source: rel.source_entity_id,
      target: rel.target_entity_id,
      label: rel.name,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#4A90E2', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#4A90E2',
      },
    }));

    // Add edges for entity field relationships
    const fieldRelationshipEdges = entities.flatMap(entity => 
      entity.fields?.filter(field => field.field_type === 'entity' && field.related_entity_id)
        .map(field => ({
          id: `field-${field.id}`,
          source: entity.id,
          target: field.related_entity_id,
          label: field.name,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#4A90E2', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#4A90E2',
          },
        })) || []
    );

    setEdges([...newEdges, ...fieldRelationshipEdges]);
  }, [relationships, entities, setEdges]);

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
        className="bg-background"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#4A90E2', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#4A90E2',
          },
        }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
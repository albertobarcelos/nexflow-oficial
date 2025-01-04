import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { EntityNode } from './EntityNode';
import { useEntities } from '../hooks/useEntities';
import { cn } from '@/lib/utils';
import { Entity } from '../types';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const nodeTypes = {
  entity: EntityNode,
};

const defaultViewport = { x: 0, y: 0, zoom: 0.7 };

type CustomNode = Node<Entity>;

export function EntityRelationshipDiagram() {
  const { entities, relationships, isLoading, refetch } = useEntities();
  const [nodes, setNodes, onNodesChange] = useNodesState<Entity>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!entities) return;

    // Transform entities into nodes with proper spacing
    const newNodes: CustomNode[] = entities.map((entity, index) => ({
      id: entity.id,
      type: 'entity',
      position: { 
        x: (index % 3) * 350, 
        y: Math.floor(index / 3) * 250 
      },
      data: entity,
      draggable: true,
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
      data: { type: rel.type },
    })) || [];

    setNodes(newNodes);
    setEdges(newEdges);
  }, [entities, relationships, setNodes, setEdges]);

  const onConnect = useCallback(async (params: Connection) => {
    if (!params.source || !params.target) return;

    const sourceEntity = entities?.find(e => e.id === params.source);
    const targetEntity = entities?.find(e => e.id === params.target);

    if (!sourceEntity || !targetEntity) return;

    const newEdge: Edge = {
      id: `${params.source}-${params.target}`,
      source: params.source,
      target: params.target,
      label: `${sourceEntity.name} → ${targetEntity.name}`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#9E9E9E', strokeWidth: 2 },
      data: { type: 'one_to_many' },
    };

    setEdges((eds) => [...eds, newEdge]);
    setHasChanges(true);
  }, [entities, setEdges]);

  const handleSaveChanges = async () => {
    try {
      // Get client_id from the first entity (all entities belong to same client)
      const clientId = entities?.[0]?.client_id;
      if (!clientId) throw new Error("Client ID not found");

      // Delete existing relationships
      await supabase
        .from('entity_relationships')
        .delete()
        .eq('client_id', clientId);

      // Insert new relationships based on edges
      const { error } = await supabase
        .from('entity_relationships')
        .insert(
          edges.map(edge => ({
            source_entity_id: edge.source,
            target_entity_id: edge.target,
            type: edge.data?.type || 'one_to_many',
            name: edge.label || 'Relacionamento',
            client_id: clientId
          }))
        );

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Relacionamentos salvos com sucesso",
      });

      setHasChanges(false);
      refetch();
    } catch (error) {
      console.error('Error saving relationships:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar relacionamentos",
        variant: "destructive",
      });
    }
  };

  const onNodesDelete = useCallback(() => {
    setHasChanges(true);
  }, []);

  const onEdgesDelete = useCallback(() => {
    setHasChanges(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
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
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultViewport={defaultViewport}
        fitView
        className="font-inter"
      >
        <Background color="#9E9E9E" />
        <Controls 
          className="bg-background border border-border rounded-lg shadow-sm"
          showInteractive={false}
        />
        <Panel position="top-right">
          <Button
            onClick={handleSaveChanges}
            disabled={!hasChanges}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Alterações
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
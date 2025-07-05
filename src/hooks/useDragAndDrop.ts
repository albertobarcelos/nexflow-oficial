import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  UniqueIdentifier,
  CollisionDetection,
  rectIntersection,
  getFirstCollision,
  pointerWithin,
  useDroppable,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

export interface DragDropItem {
  id: string;
  [key: string]: any;
}

export interface DragDropContainer {
  id: string;
  items: DragDropItem[];
}

export interface DragDropHookProps {
  containers: DragDropContainer[];
  onDragEnd: (event: DragEndEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  strategy?: 'vertical' | 'horizontal';
  collisionDetection?: CollisionDetection;
}

export interface DragDropHookResult {
  sensors: any[];
  activeId: UniqueIdentifier | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  DndContextProvider: React.ComponentType<{ children: React.ReactNode }>;
  SortableContextProvider: React.ComponentType<{ 
    id: string; 
    items: string[]; 
    children: React.ReactNode;
    strategy?: 'vertical' | 'horizontal';
  }>;
}

export function useDragAndDrop({
  containers,
  onDragEnd,
  onDragStart,
  onDragOver,
  strategy = 'vertical',
  collisionDetection = closestCenter
}: DragDropHookProps): DragDropHookResult {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // Configuração dos sensores para melhor UX
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Evita drag acidental
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Detecção de colisão personalizada para Kanban
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    // Primeiro, vamos tentar detectar colisões com os droppables
    const pointerIntersections = pointerWithin(args);
    const intersections = pointerIntersections.length > 0 
      ? pointerIntersections 
      : rectIntersection(args);

    let overId = getFirstCollision(intersections, 'id');

    if (overId != null) {
      // Se estamos sobre um container, verificamos se é um item dentro do container
      const overContainer = containers.find(container => 
        container.id === overId || container.items.some(item => item.id === overId)
      );

      if (overContainer) {
        // Se estamos sobre um item, retornamos o container
        if (overContainer.items.some(item => item.id === overId)) {
          return [{ id: overContainer.id }];
        }
        // Se estamos sobre o container, retornamos o container
        return [{ id: overContainer.id }];
      }
    }

    return intersections;
  }, [containers]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
    onDragStart?.(event);
  }, [onDragStart]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    onDragOver?.(event);
  }, [onDragOver]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    onDragEnd(event);
  }, [onDragEnd]);

  // Componente wrapper para DndContext
  const DndContextProvider = useCallback(({ children }: { children: React.ReactNode }) => (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection === closestCenter ? customCollisionDetection : collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      {children}
    </DndContext>
  ), [sensors, collisionDetection, customCollisionDetection, handleDragStart, handleDragOver, handleDragEnd]);

  // Componente wrapper para SortableContext
  const SortableContextProvider = useCallback(({ 
    id, 
    items, 
    children, 
    strategy: contextStrategy = strategy 
  }: { 
    id: string; 
    items: string[]; 
    children: React.ReactNode;
    strategy?: 'vertical' | 'horizontal';
  }) => (
    <SortableContext
      id={id}
      items={items}
      strategy={contextStrategy === 'vertical' ? verticalListSortingStrategy : horizontalListSortingStrategy}
    >
      {children}
    </SortableContext>
  ), [strategy]);

  return {
    sensors,
    activeId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    DndContextProvider,
    SortableContextProvider
  };
}

// Hook para um item sortable individual
export function useSortableItem(id: string) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return {
    attributes,
    listeners,
    setNodeRef,
    style,
    isDragging,
  };
}

// Hook para um container droppable
export function useDroppableContainer(id: string) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return {
    setNodeRef,
    isOver,
  };
}

// Utilitários para manipulação de arrays
export const dragDropUtils = {
  // Move item entre containers
  moveItemBetweenContainers: <T extends DragDropItem>(
    containers: DragDropContainer[],
    activeId: string,
    overId: string
  ): DragDropContainer[] => {
    const activeContainer = containers.find(container =>
      container.items.some(item => item.id === activeId)
    );
    const overContainer = containers.find(container => container.id === overId);

    if (!activeContainer || !overContainer || activeContainer.id === overContainer.id) {
      return containers;
    }

    const activeItem = activeContainer.items.find(item => item.id === activeId);
    if (!activeItem) return containers;

    return containers.map(container => {
      if (container.id === activeContainer.id) {
        return {
          ...container,
          items: container.items.filter(item => item.id !== activeId)
        };
      }
      if (container.id === overContainer.id) {
        return {
          ...container,
          items: [...container.items, activeItem]
        };
      }
      return container;
    });
  },

  // Reordena items dentro do mesmo container
  reorderItemsInContainer: <T extends DragDropItem>(
    containers: DragDropContainer[],
    containerId: string,
    activeId: string,
    overId: string
  ): DragDropContainer[] => {
    const container = containers.find(c => c.id === containerId);
    if (!container) return containers;

    const activeIndex = container.items.findIndex(item => item.id === activeId);
    const overIndex = container.items.findIndex(item => item.id === overId);

    if (activeIndex === -1 || overIndex === -1) return containers;

    const newItems = arrayMove(container.items, activeIndex, overIndex);

    return containers.map(c => 
      c.id === containerId ? { ...c, items: newItems } : c
    );
  }
}; 
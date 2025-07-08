import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Database, HelpCircle } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FieldTypeInfo, FieldCategory } from "./types";
import { fieldTypes, categoryNames } from "./data/fieldTypes";
import { FieldTypeCard } from "./components/FieldTypeCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";

interface FieldTypesSidebarProps {
  onFieldAdd?: (fieldType: FieldTypeInfo) => void;
}

// Componente Sortable para cada tipo de campo
function SortableFieldType({ 
  fieldType, 
  index 
}: {
  fieldType: FieldTypeInfo;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fieldType.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-2"
    >
      <FieldTypeCard
        fieldType={fieldType}
        isDragging={isDragging}
      />
    </div>
  );
}

export function FieldTypesSidebar({ onFieldAdd }: FieldTypesSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FieldCategory>("basic");

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredFieldTypes = fieldTypes.filter(fieldType => {
    const matchesSearch = fieldType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fieldType.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === fieldType.category;
    return matchesSearch && matchesCategory;
  });

  const handleDragEnd = (event: any) => {
    // Implementar lógica de drag end se necessário
    console.log('Drag ended:', event);
  };

  return (
    <Card className="flex flex-col h-full border-primary/10 shadow-md">
      <div className="p-4 border-b">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary/90 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Tipos de Campo
            </h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-primary transition-colors">
                  <HelpCircle className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[300px]">
                <p>Arraste e solte os tipos de campo para personalizar sua entidade.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tipo de campo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 border-primary/20 focus:border-primary/30 transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(categoryNames).map(([key, name]) => (
            <Badge
              key={key}
              variant="outline"
              className={cn(
                "cursor-pointer hover:bg-primary/5 transition-colors px-3 py-1",
                selectedCategory === key && "bg-primary/10 hover:bg-primary/15 border-primary/30"
              )}
              onClick={() => setSelectedCategory(key as FieldCategory)}
            >
              {name}
            </Badge>
          ))}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredFieldTypes.map(fieldType => fieldType.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 p-4">
            {filteredFieldTypes.map((fieldType, index) => (
              <SortableFieldType
                key={fieldType.id}
                fieldType={fieldType}
                index={index}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </Card>
  );
}

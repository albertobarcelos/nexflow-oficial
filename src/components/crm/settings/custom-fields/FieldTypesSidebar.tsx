import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { FieldTypeInfo, FieldCategory } from "./types";
import { fieldTypes, categoryNames } from "./data/fieldTypes";
import { FieldTypeCard } from "./components/FieldTypeCard";

interface FieldTypesSidebarProps {
  onFieldAdd?: (fieldType: FieldTypeInfo) => void;
}

export function FieldTypesSidebar({ onFieldAdd }: FieldTypesSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FieldCategory>("basic");

  const filteredFieldTypes = fieldTypes.filter(fieldType => {
    const matchesSearch = fieldType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fieldType.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === fieldType.category;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card className="p-4 h-full">
      <h2 className="text-lg font-semibold mb-4">Tipos de Campo</h2>
      
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tipo de campo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs defaultValue="basic" className="mb-4">
        <TabsList className="w-full flex flex-wrap">
          {Object.entries(categoryNames).map(([key, name]) => (
            <TabsTrigger
              key={key}
              value={key}
              onClick={() => setSelectedCategory(key as FieldCategory)}
              className="flex-1"
            >
              {name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Droppable droppableId="field-types" isDropDisabled={true}>
        {(provided) => (
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div 
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {filteredFieldTypes.map((fieldType, index) => (
                <Draggable 
                  key={fieldType.id} 
                  draggableId={fieldType.id} 
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <FieldTypeCard
                        fieldType={fieldType}
                        dragHandleProps={provided.dragHandleProps}
                        isDragging={snapshot.isDragging}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          </ScrollArea>
        )}
      </Droppable>
    </Card>
  );
}
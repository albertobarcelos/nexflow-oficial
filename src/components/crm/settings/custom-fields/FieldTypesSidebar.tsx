import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { FieldTypeInfo, FieldCategory } from "./types";
import { fieldTypes, categoryNames } from "./data/fieldTypes";
import { FieldTypeCard } from "./components/FieldTypeCard";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <Card className="p-4 h-full border-primary/10 shadow-md">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header com título e busca */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary/90">Tipos de Campo</h2>
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

        {/* Categorias em badges horizontais */}
        <div className="flex flex-wrap gap-2">
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

        {/* Lista de tipos de campo */}
        <Droppable droppableId="field-types" isDropDisabled={true}>
          {(provided) => (
            <ScrollArea className="h-[calc(100vh-350px)]">
              <motion.div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2 pr-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {filteredFieldTypes.map((fieldType, index) => (
                  <Draggable 
                    key={fieldType.id} 
                    draggableId={fieldType.id} 
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="transition-transform duration-200 ease-in-out"
                      >
                        <FieldTypeCard
                          fieldType={fieldType}
                          dragHandleProps={provided.dragHandleProps}
                          isDragging={snapshot.isDragging}
                        />
                      </motion.div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </motion.div>
            </ScrollArea>
          )}
        </Droppable>
      </motion.div>
    </Card>
  );
}
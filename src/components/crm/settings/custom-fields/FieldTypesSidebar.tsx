import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, Database, HelpCircle } from "lucide-react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { FieldTypeInfo, FieldCategory } from "./types";
import { fieldTypes, categoryNames } from "./data/fieldTypes";
import { FieldTypeCard } from "./components/FieldTypeCard";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";

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
        className="space-y-6 flex flex-col h-full"
      >
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

        <ScrollArea className="flex-1">
          <Droppable droppableId="field-types">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2 pr-2"
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
                        {...provided.dragHandleProps}
                        className="transition-transform duration-200 ease-in-out"
                      >
                        <FieldTypeCard
                          fieldType={fieldType}
                          isDragging={snapshot.isDragging}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </ScrollArea>
      </motion.div>
    </Card>
  );
}
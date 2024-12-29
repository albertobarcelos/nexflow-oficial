import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Type, AlignLeft, FileText, Paperclip, CheckSquare, 
  User, Calendar, Clock, Tag, Mail, Phone, List, 
  Radio, Timer, Hash, DollarSign, File, Fingerprint,
  Search
} from "lucide-react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { FieldTypeInfo, FieldCategory } from "./types";

const fieldTypes: FieldTypeInfo[] = [
  // Dados Básicos
  {
    id: "short_text",
    name: "Texto curto",
    description: "Para textos breves como títulos e nomes",
    icon: <Type className="w-4 h-4" />,
    category: "basic",
    validation: (value) => typeof value === "string" && value.length <= 255
  },
  {
    id: "long_text",
    name: "Texto longo",
    description: "Para descrições e notas detalhadas",
    icon: <AlignLeft className="w-4 h-4" />,
    category: "basic"
  },
  // Contato
  {
    id: "email",
    name: "Email",
    description: "Campo formatado para emails",
    icon: <Mail className="w-4 h-4" />,
    category: "contact",
    validation: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  },
  {
    id: "phone",
    name: "Telefone",
    description: "Campo formatado para telefones",
    icon: <Phone className="w-4 h-4" />,
    category: "contact",
    validation: (value) => /^\+?[\d\s-()]+$/.test(value)
  },
  // Financeiro
  {
    id: "currency",
    name: "Moeda",
    description: "Valores monetários",
    icon: <DollarSign className="w-4 h-4" />,
    category: "financial",
    validation: (value) => !isNaN(parseFloat(value))
  },
  {
    id: "numeric",
    name: "Numérico",
    description: "Apenas números",
    icon: <Hash className="w-4 h-4" />,
    category: "financial",
    validation: (value) => /^\d+$/.test(value)
  },
  // Documentos
  {
    id: "documents",
    name: "Documentos",
    description: "Gerenciamento de documentos",
    icon: <File className="w-4 h-4" />,
    category: "document"
  },
  {
    id: "attachment",
    name: "Anexo",
    description: "Para upload de arquivos",
    icon: <Paperclip className="w-4 h-4" />,
    category: "document"
  },
  // Datas
  {
    id: "date",
    name: "Data",
    description: "Selecionar uma data",
    icon: <Calendar className="w-4 h-4" />,
    category: "date"
  },
  {
    id: "datetime",
    name: "Data e hora",
    description: "Selecionar data e hora",
    icon: <Clock className="w-4 h-4" />,
    category: "date"
  },
  // Outros
  {
    id: "checkbox",
    name: "Checkbox",
    description: "Para opções sim/não",
    icon: <CheckSquare className="w-4 h-4" />,
    category: "other"
  },
  {
    id: "list",
    name: "Lista",
    description: "Lista de opções múltiplas",
    icon: <List className="w-4 h-4" />,
    category: "other"
  }
];

const categoryNames: Record<FieldCategory, string> = {
  basic: "Dados Básicos",
  contact: "Contato",
  financial: "Financeiro",
  document: "Documentos",
  date: "Datas",
  other: "Outros"
};

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
    <Card className="p-4">
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 rounded-lg hover:bg-muted cursor-grab transition-colors ${
                              snapshot.isDragging ? "bg-muted" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-muted-foreground">
                                {fieldType.icon}
                              </div>
                              <div>
                                <h3 className="font-medium text-sm">{fieldType.name}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {fieldType.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{fieldType.description}</p>
                          {fieldType.validation && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Este campo possui validação específica
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
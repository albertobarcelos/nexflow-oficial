import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { 
  Type, AlignLeft, FileText, Paperclip, CheckSquare, 
  User, Calendar, Clock, Tag, Mail, Phone, List, 
  Radio, Timer, Hash, DollarSign, File, Fingerprint 
} from "lucide-react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";

type FieldType = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
};

const fieldTypes: FieldType[] = [
  {
    id: "short_text",
    name: "Texto curto",
    description: "Para textos breves como títulos e nomes",
    icon: <Type className="w-4 h-4" />,
  },
  {
    id: "long_text",
    name: "Texto longo",
    description: "Para descrições e notas detalhadas",
    icon: <AlignLeft className="w-4 h-4" />,
  },
  {
    id: "dynamic_content",
    name: "Conteúdo dinâmico",
    description: "Conteúdo que se atualiza automaticamente",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: "attachment",
    name: "Anexo",
    description: "Para upload de arquivos",
    icon: <Paperclip className="w-4 h-4" />,
  },
  {
    id: "checkbox",
    name: "Checkbox",
    description: "Para opções sim/não",
    icon: <CheckSquare className="w-4 h-4" />,
  },
  {
    id: "responsible",
    name: "Responsável",
    description: "Atribuir responsável",
    icon: <User className="w-4 h-4" />,
  },
  {
    id: "date",
    name: "Data",
    description: "Selecionar uma data",
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    id: "datetime",
    name: "Data e hora",
    description: "Selecionar data e hora",
    icon: <Clock className="w-4 h-4" />,
  },
  {
    id: "due_date",
    name: "Data de vencimento",
    description: "Data limite para conclusão",
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    id: "tags",
    name: "Etiquetas",
    description: "Categorizar com múltiplas tags",
    icon: <Tag className="w-4 h-4" />,
  },
  {
    id: "email",
    name: "Email",
    description: "Campo formatado para emails",
    icon: <Mail className="w-4 h-4" />,
  },
  {
    id: "phone",
    name: "Número de telefone",
    description: "Campo formatado para telefones",
    icon: <Phone className="w-4 h-4" />,
  },
  {
    id: "list",
    name: "Seleção de lista",
    description: "Lista de opções múltiplas",
    icon: <List className="w-4 h-4" />,
  },
  {
    id: "single_select",
    name: "Seleção de única opção",
    description: "Escolha única entre opções",
    icon: <Radio className="w-4 h-4" />,
  },
  {
    id: "time",
    name: "Tempo",
    description: "Duração ou horário",
    icon: <Timer className="w-4 h-4" />,
  },
  {
    id: "numeric",
    name: "Numérico",
    description: "Apenas números",
    icon: <Hash className="w-4 h-4" />,
  },
  {
    id: "currency",
    name: "Moeda",
    description: "Valores monetários",
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    id: "documents",
    name: "Documentos",
    description: "Gerenciamento de documentos",
    icon: <File className="w-4 h-4" />,
  },
  {
    id: "id",
    name: "ID",
    description: "Identificador único",
    icon: <Fingerprint className="w-4 h-4" />,
  },
];

interface FieldTypesSidebarProps {
  onFieldAdd: (fieldType: FieldType) => void;
}

export function FieldTypesSidebar({ onFieldAdd }: FieldTypesSidebarProps) {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Tipos de Campo</h2>
      <Droppable droppableId="field-types" isDropDisabled={true}>
        {(provided) => (
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div 
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {fieldTypes.map((fieldType, index) => (
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
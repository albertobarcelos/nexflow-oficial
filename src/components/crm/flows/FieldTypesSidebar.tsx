import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Type, 
  Paperclip, 
  CheckSquare, 
  User, 
  Calendar, 
  Clock, 
  Timer, 
  Tag, 
  Mail, 
  Phone, 
  List, 
  Circle, 
  Hash, 
  DollarSign, 
  FileText, 
  Database,
  Link,
  AlignLeft,
  Sparkles
} from 'lucide-react';

export interface FieldType {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  category: 'basic' | 'advanced' | 'connection';
  description: string;
  color: string;
}

export const FIELD_TYPES: FieldType[] = [
  // Campos Básicos
  {
    id: 'dynamic_content',
    label: 'Conteúdo dinâmico',
    icon: Sparkles,
    category: 'basic',
    description: 'Conteúdo que muda baseado em condições',
    color: 'text-purple-600'
  },
  {
    id: 'attachment',
    label: 'Anexo',
    icon: Paperclip,
    category: 'basic',
    description: 'Upload de arquivos e documentos',
    color: 'text-gray-600'
  },
  {
    id: 'checkbox',
    label: 'Checkbox',
    icon: CheckSquare,
    category: 'basic',
    description: 'Campo de seleção verdadeiro/falso',
    color: 'text-green-600'
  },
  {
    id: 'responsible',
    label: 'Responsável',
    icon: User,
    category: 'basic',
    description: 'Atribuir usuário responsável',
    color: 'text-blue-600'
  },
  {
    id: 'date',
    label: 'Data',
    icon: Calendar,
    category: 'basic',
    description: 'Seleção de data',
    color: 'text-indigo-600'
  },
  {
    id: 'datetime',
    label: 'Data e hora',
    icon: Clock,
    category: 'basic',
    description: 'Data e horário específico',
    color: 'text-indigo-600'
  },
  {
    id: 'due_date',
    label: 'Data de vencimento',
    icon: Timer,
    category: 'basic',
    description: 'Data limite para conclusão',
    color: 'text-red-600'
  },
  {
    id: 'tags',
    label: 'Etiquetas',
    icon: Tag,
    category: 'basic',
    description: 'Tags para categorização',
    color: 'text-yellow-600'
  },
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    category: 'basic',
    description: 'Endereço de email válido',
    color: 'text-blue-600'
  },
  {
    id: 'phone',
    label: 'Número de telefone',
    icon: Phone,
    category: 'basic',
    description: 'Número de telefone formatado',
    color: 'text-green-600'
  },
  {
    id: 'select_list',
    label: 'Seleção de lista',
    icon: List,
    category: 'basic',
    description: 'Lista de opções múltiplas',
    color: 'text-purple-600'
  },
  {
    id: 'single_select',
    label: 'Seleção de única opção',
    icon: Circle,
    category: 'basic',
    description: 'Escolha única entre opções',
    color: 'text-orange-600'
  },
  {
    id: 'time',
    label: 'Tempo',
    icon: Clock,
    category: 'basic',
    description: 'Horário específico',
    color: 'text-teal-600'
  },
  {
    id: 'numeric',
    label: 'Numérico',
    icon: Hash,
    category: 'basic',
    description: 'Valores numéricos',
    color: 'text-slate-600'
  },
  {
    id: 'currency',
    label: 'Moeda',
    icon: DollarSign,
    category: 'basic',
    description: 'Valores monetários formatados',
    color: 'text-emerald-600'
  },
  {
    id: 'documents',
    label: 'Documentos',
    icon: FileText,
    category: 'basic',
    description: 'Documentos e arquivos especiais',
    color: 'text-blue-600'
  },
  {
    id: 'id',
    label: 'ID',
    icon: Hash,
    category: 'basic',
    description: 'Identificador único',
    color: 'text-gray-600'
  },
  {
    id: 'text',
    label: 'Texto',
    icon: Type,
    category: 'basic',
    description: 'Campo de texto simples',
    color: 'text-slate-600'
  },
  {
    id: 'textarea',
    label: 'Texto longo',
    icon: AlignLeft,
    category: 'basic',
    description: 'Campo de texto multilinha',
    color: 'text-slate-600'
  },
  
  // Campos de Conexão
  {
    id: 'pipe_connection',
    label: 'Conexão de pipe',
    icon: Link,
    category: 'connection',
    description: 'Conectar com outro pipeline',
    color: 'text-blue-600'
  },
  {
    id: 'database_connection',
    label: 'Conexão de database',
    icon: Database,
    category: 'connection',
    description: 'Conectar com banco de dados externo',
    color: 'text-purple-600'
  }
];

interface FieldTypesSidebarProps {
  onFieldDragStart?: (fieldType: FieldType) => void;
  selectedStage?: string;
}

export function FieldTypesSidebar({ onFieldDragStart, selectedStage }: FieldTypesSidebarProps) {
  const handleDragStart = (e: React.DragEvent, fieldType: FieldType) => {
    e.dataTransfer.setData('application/json', JSON.stringify(fieldType));
    e.dataTransfer.effectAllowed = 'copy';
    onFieldDragStart?.(fieldType);
  };

  const basicFields = FIELD_TYPES.filter(field => field.category === 'basic');
  const connectionFields = FIELD_TYPES.filter(field => field.category === 'connection');

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="pb-2">
          <h3 className="font-semibold text-gray-800 mb-1">Tipos de Campo</h3>
          <p className="text-xs text-gray-500">
            Arraste os campos para a área central
          </p>
        </div>

        {/* Campos Básicos */}
        <div className="space-y-1">
          {basicFields.map((fieldType) => {
            const Icon = fieldType.icon;
            return (
              <div
                key={fieldType.id}
                draggable
                onDragStart={(e) => handleDragStart(e, fieldType)}
                className="group p-3 bg-white rounded-md border border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors flex-shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${fieldType.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 truncate">
                      {fieldType.label}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {fieldType.description}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Campos de Conexão */}
        {connectionFields.length > 0 && (
          <div className="space-y-1">
            <div className="pt-3 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Campos de conexão</h4>
              <p className="text-xs text-gray-500 mb-3">
                Conectar com outros pipes e databases
              </p>
            </div>
            
            {connectionFields.map((fieldType) => {
              const Icon = fieldType.icon;
              return (
                <div
                  key={fieldType.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, fieldType)}
                  className="group p-3 bg-white rounded-md border border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors flex-shrink-0">
                      <Icon className={`w-3.5 h-3.5 ${fieldType.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-700 truncate">
                        {fieldType.label}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {fieldType.description}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            {basicFields.length + connectionFields.length} tipos disponíveis
          </div>
        </div>
      </div>
    </div>
  );
} 
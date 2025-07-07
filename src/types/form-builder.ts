export interface FieldConfiguration {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  description?: string;
  helpText?: string;
  required: boolean;
  editableInOtherStages: boolean;
  uniqueValue: boolean;
  compactView: boolean;
  order: number;
  
  // Configurações específicas por tipo
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    format?: string;
  };
  
  // Para campos de seleção
  options?: {
    label: string;
    value: string;
    color?: string;
  }[];
  
  // Para campos de data
  dateFormat?: string;
  showTime?: boolean;
  
  // Para campos de anexo
  acceptedTypes?: string[];
  maxFileSize?: number;
  
  // Para campos de responsável
  allowMultiple?: boolean;
  filterByRole?: string[];
  
  // Para campos de conexão
  connectedPipe?: string;
  connectedDatabase?: string;
  
  // Dependências
  dependencies?: {
    fieldId: string;
    condition: string;
    value: any;
  }[];
}

export interface FieldPreviewProps {
  field: FieldConfiguration;
  isSelected?: boolean;
  onSelect?: (field: FieldConfiguration) => void;
}

export interface FieldConfigurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: FieldConfiguration | null;
  onSave: (field: FieldConfiguration) => void;
  onCancel: () => void;
}

export interface FieldTypeDefinition {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  category: 'basic' | 'advanced' | 'connection';
  defaultConfig: Partial<FieldConfiguration>;
  configOptions: {
    showDescription: boolean;
    showHelpText: boolean;
    showRequired: boolean;
    showCompactView: boolean;
    showEditableInOtherStages: boolean;
    showUniqueValue: boolean;
    showValidation: boolean;
    showOptions: boolean;
    showDateFormat: boolean;
    showFileConfig: boolean;
    showUserConfig: boolean;
    showConnectionConfig: boolean;
  };
} 
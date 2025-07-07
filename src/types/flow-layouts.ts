// Tipos para o sistema de layouts personalizados dos flows (inspirado no Pipefy)

export interface FlowOverviewField {
  id: string;
  type: 'text' | 'textarea' | 'email' | 'phone' | 'url' | 'number' | 'currency' | 'percentage' | 'date' | 'datetime' | 'time' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  unique?: boolean;
  options?: string[]; // Para select, multiselect, radio
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  defaultValue?: any;
  width?: 'full' | 'half'; // Largura do campo na seção
}

export interface FlowOverviewSection {
  id: string;
  title: string;
  collapsed: boolean;
  fields: FlowOverviewField[];
  order: number;
  column: 1 | 2; // Em qual coluna a seção deve aparecer
}

export interface FlowOverviewLayout {
  id: string;
  flow_id: string;
  layout_name: string;
  columns_count: number;
  sections: FlowOverviewSection[];
  available_fields: FlowOverviewField[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Tipos para configuração de layout
export interface LayoutConfigurationState {
  layout: FlowOverviewLayout;
  isDirty: boolean;
  isLoading: boolean;
  error?: string;
}

export interface SectionDragItem {
  id: string;
  type: 'section';
  section: FlowOverviewSection;
}

export interface FieldDragItem {
  id: string;
  type: 'field';
  field: FlowOverviewField;
  sourceSection?: string;
}

// Tipos para renderização da visão geral
export interface DealOverviewData {
  [fieldId: string]: any;
}

export interface SectionRenderProps {
  section: FlowOverviewSection;
  data: DealOverviewData;
  onFieldChange: (fieldId: string, value: any) => void;
  readOnly?: boolean;
}

// Tipos para templates de layout (similar aos templates de entidade)
export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  category: 'vendas' | 'imobiliaria' | 'consultoria' | 'ecommerce' | 'servicos' | 'outros';
  icon: string;
  sections: Omit<FlowOverviewSection, 'id' | 'order'>[];
  fields: Omit<FlowOverviewField, 'id'>[];
}

// Constantes para tipos de campo
export const FIELD_TYPES = {
  text: { label: 'Texto', icon: 'Type' },
  textarea: { label: 'Texto Longo', icon: 'AlignLeft' },
  email: { label: 'Email', icon: 'Mail' },
  phone: { label: 'Telefone', icon: 'Phone' },
  url: { label: 'URL', icon: 'Link' },
  number: { label: 'Número', icon: 'Hash' },
  currency: { label: 'Moeda', icon: 'DollarSign' },
  percentage: { label: 'Porcentagem', icon: 'Percent' },
  date: { label: 'Data', icon: 'Calendar' },
  datetime: { label: 'Data e Hora', icon: 'Clock' },
  time: { label: 'Hora', icon: 'Clock' },
  select: { label: 'Seleção', icon: 'ChevronDown' },
  multiselect: { label: 'Múltipla Seleção', icon: 'CheckSquare' },
  checkbox: { label: 'Checkbox', icon: 'Square' },
  radio: { label: 'Opção Única', icon: 'Circle' },
  file: { label: 'Arquivo', icon: 'Upload' }
} as const;

export type FieldType = keyof typeof FIELD_TYPES; 
import { Database } from './database'

// AIDEV-NOTE: Sistema simplificado - foco exclusivo em deals e campos personalizados
// Entidades dinâmicas removidas durante migração de simplificação

export type DealCustomField = Database['public']['Tables']['web_deal_custom_fields']['Row']
export type DealCustomFieldInsert = Database['public']['Tables']['web_deal_custom_fields']['Insert']
export type DealCustomFieldUpdate = Database['public']['Tables']['web_deal_custom_fields']['Update']

// Tipos de campos suportados para deals
export type FieldType = 
  | 'short_text'
  | 'long_text' 
  | 'email'
  | 'phone'
  | 'url'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'checkbox'
  | 'single_select'
  | 'multi_select'
  | 'user_select'
  | 'file_upload'
  | 'rich_text'

// Interface para configuração de campo personalizado de deal
export interface DealFieldConfig {
  type: FieldType
  required?: boolean
  unique?: boolean
  defaultValue?: any
  options?: string[] // Para select fields
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  layout?: {
    width: 'quarter' | 'half' | 'three_quarters' | 'full'
    column?: number
    order?: number
  }
}

// Interface para validação de campo de deal
export interface DealFieldValidationResult {
  isValid: boolean
  errors: string[]
}

// Interface para dados do formulário de deal
export interface DealFormData {
  dealId?: string
  values: Record<string, any>
}

// Interface para configuração de layout do formulário de deal
export interface DealFormLayoutConfig {
  sections: DealFormSection[]
  columns: number
  spacing: 'compact' | 'normal' | 'spacious'
}

export interface DealFormSection {
  title?: string
  description?: string
  fields: string[] // Field slugs
  collapsible?: boolean
  defaultExpanded?: boolean
}

// Enum para validação de campos de deal
export enum DealFieldValidationType {
  REQUIRED = 'required',
  UNIQUE = 'unique',
  FORMAT = 'format',
  RANGE = 'range'
}
import { Database } from './database'

// Tipos das tabelas do sistema de entidades dinâmicas
export type Entity = Database['public']['Tables']['web_entities']['Row']
export type EntityInsert = Database['public']['Tables']['web_entities']['Insert']
export type EntityUpdate = Database['public']['Tables']['web_entities']['Update']

export type EntityField = Database['public']['Tables']['web_entity_fields']['Row']
export type EntityFieldInsert = Database['public']['Tables']['web_entity_fields']['Insert']
export type EntityFieldUpdate = Database['public']['Tables']['web_entity_fields']['Update']

export type EntityRecord = Database['public']['Tables']['web_entity_records']['Row']
export type EntityRecordInsert = Database['public']['Tables']['web_entity_records']['Insert']
export type EntityRecordUpdate = Database['public']['Tables']['web_entity_records']['Update']

export type EntityRelationship = Database['public']['Tables']['web_entity_relationships']['Row']
export type EntityRelationshipInsert = Database['public']['Tables']['web_entity_relationships']['Insert']
export type EntityRelationshipUpdate = Database['public']['Tables']['web_entity_relationships']['Update']

export type EntityRecordLink = Database['public']['Tables']['web_entity_record_links']['Row']
export type EntityRecordLinkInsert = Database['public']['Tables']['web_entity_record_links']['Insert']
export type EntityRecordLinkUpdate = Database['public']['Tables']['web_entity_record_links']['Update']

export type DealCustomField = Database['public']['Tables']['web_deal_custom_fields']['Row']
export type DealCustomFieldInsert = Database['public']['Tables']['web_deal_custom_fields']['Insert']
export type DealCustomFieldUpdate = Database['public']['Tables']['web_deal_custom_fields']['Update']

// Tipos de campos suportados
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
  | 'entity_reference'
  | 'file_upload'
  | 'rich_text'

// Tipos de relacionamentos
export type RelationshipType = 'one_to_one' | 'one_to_many' | 'many_to_many'

// Interface para configuração de campo
export interface FieldConfig {
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

// Interface para entidade completa com campos
export interface EntityWithFields extends Entity {
  fields: EntityField[]
  relationships?: EntityRelationship[]
}

// Interface para registro com dados tipados
export interface EntityRecordWithData extends EntityRecord {
  entity: Entity
  created_by_user?: {
    first_name: string
    last_name: string
    email: string
  }
  updated_by_user?: {
    first_name: string
    last_name: string
    email: string
  }
  fieldValues?: Record<string, any>
  relatedRecords?: Record<string, EntityRecord[]>
}

// Interface para configuração de flow com entidades
export interface FlowEntityConfig {
  allowedEntities: string[] // IDs das entidades permitidas
  requiredFields: string[] // Slugs dos campos obrigatórios
  primaryEntity?: string // ID da entidade principal
  customFields?: FieldConfig[] // Campos personalizados do flow
}

// Interface para busca de registros relacionados
export interface RelatedRecordSearch {
  entityId: string
  searchTerm: string
  page: number
  pageSize: number
}

// Interface para resultado de busca
export interface SearchResult {
  recordId: string
  displayValue: string
  totalCount: number
}

// Interface para validação de campo
export interface FieldValidationResult {
  isValid: boolean
  errors: string[]
}

// Interface para dados do formulário dinâmico
export interface DynamicFormData {
  entityId: string
  recordId?: string
  values: Record<string, any>
  relationships?: Record<string, string[]>
}

// Interface para configuração de layout do formulário
export interface FormLayoutConfig {
  sections: FormSection[]
  columns: number
  spacing: 'compact' | 'normal' | 'spacious'
}

export interface FormSection {
  title?: string
  description?: string
  fields: string[] // Field slugs
  collapsible?: boolean
  defaultExpanded?: boolean
}

// Enums para status e tipos
export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

export enum FieldValidationType {
  REQUIRED = 'required',
  UNIQUE = 'unique',
  FORMAT = 'format',
  RANGE = 'range'
}

// Interface para histórico de mudanças
export interface EntityChangeHistory {
  id: string
  entityId: string
  recordId: string
  fieldSlug: string
  oldValue: any
  newValue: any
  changedBy: string
  changedAt: string
  changeType: 'create' | 'update' | 'delete'
}

// Interface para permissões de entidade
export interface EntityPermissions {
  entityId: string
  userId: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  fieldPermissions?: Record<string, {
    canView: boolean
    canEdit: boolean
  }>
}

// Interface para estatísticas de entidade
export interface EntityStats {
  entityId: string
  totalRecords: number
  recordsThisMonth: number
  recordsThisWeek: number
  lastActivity: string
  topUsers: Array<{
    userId: string
    userName: string
    recordCount: number
  }>
} 
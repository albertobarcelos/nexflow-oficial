/**
 * Tipos de entidade e relacionamentos (deals, campos personalizados).
 * Centraliza EntityType, OpportunityEntityRelationship e CustomFieldValue
 * usados em useContactRelationships e useCustomFieldValues.
 */

/** Tipo de entidade para relacionamentos de deal (company, person, partner). */
export type EntityType = "company" | "person" | "partner";

/** Relação mínima retornada pelo select (id, name). */
interface EntityRef {
  id: string;
  name: string | null;
}

/** Linha de relacionamento deal + entidades aninhadas (companies, people, partners). */
export interface OpportunityEntityRelationship {
  id: string;
  entity_type?: string;
  company_id: string | null;
  person_id: string | null;
  partner_id: string | null;
  companies?: EntityRef | null;
  people?: EntityRef | null;
  partners?: EntityRef | null;
}

/** Valor de campo personalizado (deal_custom_field_values). */
export interface CustomFieldValue {
  field_id: string;
  value: unknown;
}

import type { NexflowCard } from "@/types/nexflow";

/**
 * Constantes para campos de sistema
 * Campos de sistema são salvos em colunas relacionais, não no JSONB field_values
 */
export const SYSTEM_FIELDS = {
  ASSIGNED_TO: "assigned_to",
} as const;

export type SystemFieldSlug = typeof SYSTEM_FIELDS[keyof typeof SYSTEM_FIELDS];

/**
 * Verifica se um slug identifica um campo de sistema
 */
export function isSystemField(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return Object.values(SYSTEM_FIELDS).includes(slug as SystemFieldSlug);
}

/**
 * Obtém o valor de um campo de sistema a partir do card
 */
export function getSystemFieldValue(
  card: NexflowCard,
  slug: string
): string | null {
  if (slug === SYSTEM_FIELDS.ASSIGNED_TO) {
    return card.assignedTo ?? null;
  }
  return null;
}

/**
 * Separa campos de sistema dos campos genéricos em um objeto de valores
 */
export function separateSystemFields(
  fieldValues: Record<string, unknown>
): {
  systemFields: Record<string, string | null>;
  genericFields: Record<string, unknown>;
} {
  const systemFields: Record<string, string | null> = {};
  const genericFields: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fieldValues)) {
    if (isSystemField(key)) {
      systemFields[key] = (value as string) || null;
    } else {
      genericFields[key] = value;
    }
  }

  return { systemFields, genericFields };
}


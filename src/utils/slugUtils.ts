/**
 * Remove acentos de uma string
 */
function removeAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Gera um slug a partir de um texto
 * Converte para snake_case: remove acentos, converte para minúsculas,
 * substitui espaços e caracteres especiais por underscore
 */
export function generateSlug(text: string): string {
  if (!text) return "";

  // Remove acentos
  let slug = removeAccents(text);

  // Converte para minúsculas
  slug = slug.toLowerCase();

  // Substitui espaços e caracteres especiais por underscore
  slug = slug.replace(/[^a-z0-9]+/g, "_");

  // Remove underscores duplicados
  slug = slug.replace(/_+/g, "_");

  // Remove underscores no início e fim
  slug = slug.replace(/^_+|_+$/g, "");

  return slug;
}



















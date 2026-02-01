/**
 * Utilitários para parse de CSV no cliente.
 * Espelha a lógica da Edge Function import-cards-csv para consistência.
 */

/**
 * Parse uma linha CSV individual (suporta aspas e vírgulas dentro de aspas).
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(currentValue);
      currentValue = "";
    } else {
      currentValue += char;
    }
  }

  values.push(currentValue);
  return values;
}

export interface ParseCsvResult {
  headers: string[];
  rows: Array<Record<string, string>>;
}

/**
 * Parse texto CSV e retorna cabeçalhos e linhas como objetos indexados pelo nome da coluna.
 * Primeira linha é tratada como cabeçalho.
 *
 * @param csvText - Conteúdo do arquivo CSV
 * @param options - maxPreviewRows: limite de linhas de dados (default todas); skipEmptyHeaders: ignorar colunas com cabeçalho vazio
 */
export function parseCsv(
  csvText: string,
  options?: { maxPreviewRows?: number; skipEmptyHeaders?: boolean }
): ParseCsvResult {
  const { maxPreviewRows, skipEmptyHeaders = false } = options ?? {};
  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if (char === "\n" && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = "";
    } else if (char === "\r") {
      continue;
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headerLine = lines[0]!;
  const rawHeaders = parseCsvLine(headerLine).map((h) => h.trim());
  const headers = skipEmptyHeaders
    ? rawHeaders.filter((h) => h.length > 0)
    : rawHeaders;

  const startIndex = 1;
  const endIndex =
    maxPreviewRows != null
      ? Math.min(startIndex + maxPreviewRows, lines.length)
      : lines.length;

  const rows: Array<Record<string, string>> = [];
  for (let i = startIndex; i < endIndex; i++) {
    const values = parseCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Lê um arquivo File como texto UTF-8.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "UTF-8");
  });
}

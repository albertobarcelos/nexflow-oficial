// @ts-ignore - JSR imports são específicos do Deno runtime e funcionam no Supabase Edge Functions
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore - JSR imports são específicos do Deno runtime e funcionam no Supabase Edge Functions
import { createClient } from "jsr:@supabase/supabase-js@2";

// Declaração de tipo para Deno (necessário para TypeScript no editor)
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Tipos para o payload
interface ImportCardsCsvPayload {
  csvFile: string; // Base64 string ou data URL
  config: {
    flowId: string;
    defaultStepId: string;
    columnMapping: {
      nativeFields?: {
        title?: string;
        value?: string;
        product?: string;
        contact?: string;
        company?: string;
        lead?: string;
        assignedTo?: string;
        assignedTeamId?: string;
      };
      stepFields?: Record<string, string>;
      unmappedColumns?: "ignore" | "create_fields";
    };
    stepRouting?: {
      column: string;
      rules: Array<{
        value: string | number;
        stepId: string;
        matchType?: "exact" | "contains" | "regex";
      }>;
      defaultStepId?: string;
    };
    createMissingFields?: {
      enabled: boolean;
      defaultFieldType?: "text" | "number" | "date";
      targetStepId?: string;
    };
    /** Quando definido, cada linha cria um card_item com este produto e valor da coluna indicada */
    productValueToExistingItem?: {
      itemId: string;
      valueColumn: string;
    };
    batchSize?: number;
    skipHeaderRow?: boolean;
  };
}

interface ImportCardsCsvResponse {
  success: boolean;
  summary: {
    totalRows: number;
    successfulImports: number;
    failedImports: number;
    createdFields: number;
  };
  results: Array<{
    rowNumber: number;
    status: "success" | "error";
    cardId?: string;
    error?: string;
    stepId: string;
  }>;
  createdFields?: Array<{
    fieldId: string;
    label: string;
    slug: string;
    stepId: string;
  }>;
  errors?: Array<{
    rowNumber: number;
    error: string;
    data: Record<string, unknown>;
  }>;
}

// Constantes
const MAX_CSV_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_FIELD_TYPE = "text";

// =====================================================
// Funções Auxiliares
// =====================================================

/**
 * Decodifica arquivo CSV de base64 ou data URL
 */
function decodeCsvFile(csvFile: string): string {
  // Se for data URL, extrair apenas a parte base64
  if (csvFile.startsWith("data:")) {
    const base64Index = csvFile.indexOf("base64,");
    if (base64Index !== -1) {
      csvFile = csvFile.substring(base64Index + 7);
    }
  }

  try {
    // Decodificar base64 para string
    const binaryString = atob(csvFile);
    // Converter para UTF-8
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
  } catch (error) {
    throw new Error(`Erro ao decodificar CSV: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}

/**
 * Parse CSV simples (suporta aspas e vírgulas)
 */
function parseCsv(csvText: string, skipHeader: boolean = true): Array<Record<string, string>> {
  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;

  // Processar caractere por caractere para lidar com aspas
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Aspas duplas escapadas
        currentLine += '"';
        i++; // Pular próximo caractere
      } else {
        // Toggle aspas
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if (char === "\n" && !inQuotes) {
      // Nova linha fora de aspas
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = "";
    } else if (char === "\r") {
      // Ignorar \r (será seguido de \n)
      continue;
    } else {
      currentLine += char;
    }
  }

  // Adicionar última linha
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) {
    return [];
  }

  // Parsear primeira linha como cabeçalho
  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine);

  // Determinar índice inicial
  const startIndex = skipHeader ? 1 : 0;

  // Parsear linhas de dados
  const rows: Array<Record<string, string>> = [];
  for (let i = startIndex; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};

    // Mapear valores para cabeçalhos
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || "";
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Parse uma linha CSV individual
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
        // Aspas duplas escapadas
        currentValue += '"';
        i++;
      } else {
        // Toggle aspas
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // Separador de campo
      values.push(currentValue);
      currentValue = "";
    } else {
      currentValue += char;
    }
  }

  // Adicionar último valor
  values.push(currentValue);

  return values;
}

/**
 * Gera slug a partir de um texto
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "_") // Substitui caracteres especiais por underscore
    .replace(/^_+|_+$/g, ""); // Remove underscores no início e fim
}

/**
 * Aplica roteamento inteligente baseado em valores
 */
function routeToStep(
  row: Record<string, string>,
  routing: ImportCardsCsvPayload["config"]["stepRouting"],
  defaultStepId: string
): string {
  if (!routing || !routing.column) {
    return defaultStepId;
  }

  const columnValue = row[routing.column]?.toString() || "";

  // Aplicar regras na ordem
  for (const rule of routing.rules || []) {
    const ruleValue = rule.value.toString();
    const matchType = rule.matchType || "exact";

    let matches = false;

    switch (matchType) {
      case "exact":
        matches = columnValue === ruleValue;
        break;
      case "contains":
        matches = columnValue.toLowerCase().includes(ruleValue.toLowerCase());
        break;
      case "regex":
        try {
          const regex = new RegExp(ruleValue, "i");
          matches = regex.test(columnValue);
        } catch (error) {
          console.error(`Erro ao processar regex ${ruleValue}:`, error);
          matches = false;
        }
        break;
    }

    if (matches) {
      return rule.stepId;
    }
  }

  // Retornar step padrão do roteamento ou defaultStepId
  return routing.defaultStepId || defaultStepId;
}

/**
 * Cria um step_field automaticamente
 */
async function createStepField(
  supabase: ReturnType<typeof createClient>,
  stepId: string,
  label: string,
  fieldType: "text" | "number" | "date",
  position: number
): Promise<{ id: string; slug: string } | null> {
  const slug = generateSlug(label);

  // Verificar se já existe campo com mesmo slug no step
  const { data: existingField } = await supabase
    .from("step_fields")
    .select("id, slug")
    .eq("step_id", stepId)
    .eq("slug", slug)
    .single();

  if (existingField) {
    return { id: existingField.id, slug: existingField.slug };
  }

  // Criar novo campo
  const { data: newField, error } = await supabase
    .from("step_fields")
    .insert({
      step_id: stepId,
      label: label,
      slug: slug,
      field_type: fieldType,
      is_required: false,
      position: position,
      configuration: {},
    })
    .select("id, slug")
    .single();

  if (error || !newField) {
    console.error(`Erro ao criar step_field ${label}:`, error);
    return null;
  }

  return { id: newField.id, slug: newField.slug };
}

/**
 * Mapeia campos de uma linha CSV para estrutura de card
 */
async function mapRowToCard(
  row: Record<string, string>,
  rowNumber: number,
  config: ImportCardsCsvPayload["config"],
  clientId: string,
  flowId: string,
  supabase: ReturnType<typeof createClient>,
  stepFieldsMap: Map<string, { id: string; slug: string }>,
  createdFields: Array<{ fieldId: string; label: string; slug: string; stepId: string }>
): Promise<{
  card: {
    flow_id: string;
    step_id: string;
    client_id: string;
    title: string;
    field_values: Record<string, unknown>;
    value?: number | null;
    product?: string | null;
    lead?: string | null;
    assigned_to?: string | null;
    assigned_team_id?: string | null;
    company_id?: string | null;
    contact_id?: string | null;
    created_by: string;
    position: number;
  };
  stepId: string;
  errors: string[];
}> {
  const errors: string[] = [];
  const fieldValues: Record<string, unknown> = {};

  // Mapear campos nativos
  const title = config.columnMapping.nativeFields?.title
    ? row[config.columnMapping.nativeFields.title] || ""
    : `Card ${rowNumber}`;

  if (!title.trim()) {
    errors.push("Título é obrigatório");
  }

  // Mapear valor
  let value: number | null = null;
  if (config.columnMapping.nativeFields?.value) {
    const valueStr = row[config.columnMapping.nativeFields.value];
    if (valueStr) {
      const parsedValue = parseFloat(valueStr.replace(/[^\d.,-]/g, "").replace(",", "."));
      if (!isNaN(parsedValue)) {
        value = parsedValue;
      }
    }
  }

  // Mapear produto
  const product = config.columnMapping.nativeFields?.product
    ? row[config.columnMapping.nativeFields.product] || null
    : null;

  // Mapear lead
  const lead = config.columnMapping.nativeFields?.lead
    ? row[config.columnMapping.nativeFields.lead] || null
    : null;

  // Mapear assigned_to (UUID do usuário)
  const assignedTo = config.columnMapping.nativeFields?.assignedTo
    ? row[config.columnMapping.nativeFields.assignedTo] || null
    : null;

  // Mapear assigned_team_id (UUID do time)
  const assignedTeamId = config.columnMapping.nativeFields?.assignedTeamId
    ? row[config.columnMapping.nativeFields.assignedTeamId] || null
    : null;

  // Mapear step_fields existentes
  if (config.columnMapping.stepFields) {
    for (const [fieldSlug, csvColumn] of Object.entries(config.columnMapping.stepFields)) {
      const fieldInfo = stepFieldsMap.get(fieldSlug);
      if (fieldInfo) {
        const value = row[csvColumn] || "";
        if (value) {
          fieldValues[fieldInfo.id] = value;
        }
      }
    }
  }

  // Processar colunas não mapeadas
  if (config.columnMapping.unmappedColumns === "create_fields") {
    const mappedColumns = new Set([
      ...Object.values(config.columnMapping.nativeFields || {}),
      ...Object.values(config.columnMapping.stepFields || {}),
    ]);

    const targetStepId = config.createMissingFields?.targetStepId || config.defaultStepId;
    let position = 0;

    // Buscar última posição de campo no step
    const { data: lastField } = await supabase
      .from("step_fields")
      .select("position")
      .eq("step_id", targetStepId)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    if (lastField) {
      position = (lastField.position || 0) + 1;
    }

    for (const [columnName, columnValue] of Object.entries(row)) {
      if (!mappedColumns.has(columnName) && columnValue) {
        const fieldType = config.createMissingFields?.defaultFieldType || DEFAULT_FIELD_TYPE;
        const fieldInfo = await createStepField(
          supabase,
          targetStepId,
          columnName,
          fieldType as "text" | "number" | "date",
          position++
        );

        if (fieldInfo) {
          stepFieldsMap.set(fieldInfo.slug, fieldInfo);
          fieldValues[fieldInfo.id] = columnValue;
          createdFields.push({
            fieldId: fieldInfo.id,
            label: columnName,
            slug: fieldInfo.slug,
            stepId: targetStepId,
          });
        }
      }
    }
  }

  // Empresa: find/create web_companies e setar company_id no card
  let companyId: string | null = null;
  if (config.columnMapping.nativeFields?.company) {
    const companyCol = config.columnMapping.nativeFields.company;
    const companyName = row[companyCol]?.trim();
    if (companyName) {
      const company = await findOrCreateWebCompany(supabase, clientId, companyName);
      companyId = company?.id ?? null;
    }
  }

  // Contato: find/create contacts e setar contact_id no card (antes do insert)
  let contactId: string | null = null;
  if (config.columnMapping.nativeFields?.contact) {
    const contactCol = config.columnMapping.nativeFields.contact;
    const mainContactValue = row[contactCol]?.trim();
    if (mainContactValue) {
      const companyNameForContact = config.columnMapping.nativeFields?.company
        ? row[config.columnMapping.nativeFields.company]?.trim()
        : undefined;
      const contact = await findOrCreateContact(
        supabase,
        clientId,
        mainContactValue,
        companyNameForContact
      );
      contactId = contact?.id ?? null;
    }
  }

  // Aplicar roteamento de step
  const stepId = routeToStep(row, config.stepRouting, config.defaultStepId);

  return {
    card: {
      flow_id: flowId,
      step_id: stepId,
      client_id: clientId,
      title: title.trim() || `Card ${rowNumber}`,
      field_values: fieldValues,
      value: value,
      product: product,
      lead: lead,
      assigned_to: assignedTo,
      assigned_team_id: assignedTeamId,
      company_id: companyId,
      contact_id: contactId,
      created_by: "", // Será preenchido depois
      position: 0, // Será calculado depois
    },
    stepId,
    errors,
  };
}

/**
 * Busca posição máxima para um step
 */
async function getMaxPositionForStep(
  supabase: ReturnType<typeof createClient>,
  stepId: string
): Promise<number> {
  const { data } = await supabase
    .from("cards")
    .select("position")
    .eq("step_id", stepId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  return data?.position || 0;
}

/**
 * Busca ou cria web_item por nome e client_id.
 * Se não existir, insere com item_type "product", billing_type "recurring".
 * nativeFields.product implica criar/buscar web_items e inserir card_items.
 */
async function findOrCreateWebItem(
  supabase: ReturnType<typeof createClient>,
  clientId: string,
  productName: string,
  price?: number | null
): Promise<{ id: string; name: string; price: number | null } | null> {
  const name = productName.trim();
  if (!name) return null;

  const nameLower = name.toLowerCase();
  const { data: existing } = await supabase
    .from("web_items")
    .select("id, name, price")
    .eq("client_id", clientId)
    .ilike("name", nameLower)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      price: existing.price ?? null,
    };
  }

  const { data: created, error } = await supabase
    .from("web_items")
    .insert({
      client_id: clientId,
      name: name,
      item_type: "product",
      billing_type: "recurring",
      price: price ?? null,
      is_active: true,
    })
    .select("id, name, price")
    .single();

  if (error || !created) {
    console.error("Erro ao criar web_item:", error);
    return null;
  }
  return {
    id: created.id,
    name: created.name,
    price: created.price ?? null,
  };
}

/**
 * Busca ou cria contact por main_contact e client_id.
 * Unicidade: client_id + main_contact (trim, case-insensitive).
 * nativeFields.contact implica find/create contacts e insert em card_contacts.
 */
async function findOrCreateContact(
  supabase: ReturnType<typeof createClient>,
  clientId: string,
  mainContactValue: string,
  clientNameValue?: string
): Promise<{ id: string } | null> {
  const mainContact = mainContactValue.trim();
  if (!mainContact) return null;

  const { data: existing } = await supabase
    .from("contacts")
    .select("id")
    .eq("client_id", clientId)
    .ilike("main_contact", mainContact)
    .limit(1)
    .maybeSingle();

  if (existing) return { id: existing.id };

  const clientName = (clientNameValue ?? mainContact).trim() || mainContact;
  const { data: created, error } = await supabase
    .from("contacts")
    .insert({
      client_id: clientId,
      main_contact: mainContact,
      client_name: clientName,
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("Erro ao criar contact:", error);
    return null;
  }
  return { id: created.id };
}

/**
 * Busca ou cria web_company por name e client_id.
 * nativeFields.company implica find/create web_companies e setar cards.company_id.
 */
async function findOrCreateWebCompany(
  supabase: ReturnType<typeof createClient>,
  clientId: string,
  companyName: string
): Promise<{ id: string } | null> {
  const name = companyName.trim();
  if (!name) return null;

  const { data: existing } = await supabase
    .from("web_companies")
    .select("id")
    .eq("client_id", clientId)
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (existing) return { id: existing.id };

  const { data: created, error } = await supabase
    .from("web_companies")
    .insert({
      client_id: clientId,
      name: name,
      company_type: "customer",
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("Erro ao criar web_company:", error);
    return null;
  }
  return { id: created.id };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse Body
    let body: ImportCardsCsvPayload;
    try {
      body = await req.json();
    } catch (parseError: unknown) {
      return new Response(
        JSON.stringify({
          error: `Erro ao fazer parse do JSON: ${
            parseError instanceof Error ? parseError.message : "Erro desconhecido"
          }`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { csvFile, config } = body;

    // Validações básicas
    if (!csvFile || !config) {
      return new Response(
        JSON.stringify({ error: "csvFile e config são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!config.flowId || !config.defaultStepId) {
      return new Response(
        JSON.stringify({
          error: "flowId e defaultStepId são obrigatórios",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar cliente com service role para operações no banco
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Validar autenticação do usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação não fornecido" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar cliente com token do usuário para validar autenticação
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Obter usuário autenticado
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Usuário não autenticado",
          details: userError?.message,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;

    // Buscar client_id do usuário
    const { data: userData, error: userDataError } = await supabase
      .from("core_client_users")
      .select("client_id")
      .eq("id", userId)
      .single();

    if (userDataError || !userData) {
      return new Response(
        JSON.stringify({
          error: "Erro ao buscar dados do usuário",
          details: userDataError?.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const clientId = userData.client_id;

    // Validar se flow existe e pertence ao client_id
    const { data: flow, error: flowError } = await supabase
      .from("flows")
      .select("id, client_id")
      .eq("id", config.flowId)
      .single();

    if (flowError || !flow) {
      return new Response(
        JSON.stringify({
          error: "Flow não encontrado",
          details: flowError?.message,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (flow.client_id !== clientId) {
      return new Response(
        JSON.stringify({
          error: "Acesso negado: flow não pertence ao seu cliente",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar se defaultStepId existe e pertence ao flow
    const { data: defaultStep, error: defaultStepError } = await supabase
      .from("steps")
      .select("id, flow_id")
      .eq("id", config.defaultStepId)
      .single();

    if (defaultStepError || !defaultStep) {
      return new Response(
        JSON.stringify({
          error: "Step padrão não encontrado",
          details: defaultStepError?.message,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (defaultStep.flow_id !== config.flowId) {
      return new Response(
        JSON.stringify({
          error: "Step padrão não pertence ao flow especificado",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar step_ids das regras de roteamento se existirem
    if (config.stepRouting?.rules) {
      const stepIds = [
        ...config.stepRouting.rules.map((r) => r.stepId),
        ...(config.stepRouting.defaultStepId
          ? [config.stepRouting.defaultStepId]
          : []),
      ];

      const { data: steps, error: stepsError } = await supabase
        .from("steps")
        .select("id, flow_id")
        .in("id", stepIds);

      if (stepsError) {
        return new Response(
          JSON.stringify({
            error: "Erro ao validar steps de roteamento",
            details: stepsError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const invalidSteps = stepIds.filter(
        (stepId) => !steps?.some((s) => s.id === stepId && s.flow_id === config.flowId)
      );

      if (invalidSteps.length > 0) {
        return new Response(
          JSON.stringify({
            error: "Alguns steps de roteamento não pertencem ao flow",
            invalidSteps,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Decodificar e parsear CSV
    let csvText: string;
    try {
      csvText = decodeCsvFile(csvFile);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Erro ao decodificar arquivo CSV",
          details: error instanceof Error ? error.message : "Erro desconhecido",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar tamanho do CSV
    if (csvText.length > MAX_CSV_SIZE) {
      return new Response(
        JSON.stringify({
          error: `Arquivo CSV muito grande. Tamanho máximo: ${MAX_CSV_SIZE / 1024 / 1024}MB`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parsear CSV
    const skipHeader = config.skipHeaderRow !== false; // Padrão: true
    let csvRows: Array<Record<string, string>>;
    try {
      csvRows = parseCsv(csvText, skipHeader);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Erro ao parsear CSV",
          details: error instanceof Error ? error.message : "Erro desconhecido",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (csvRows.length === 0) {
      return new Response(
        JSON.stringify({
          error: "CSV não contém dados válidos",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Buscar step_fields existentes do flow
    const { data: allSteps, error: stepsError } = await supabase
      .from("steps")
      .select("id")
      .eq("flow_id", config.flowId);

    if (stepsError || !allSteps) {
      return new Response(
        JSON.stringify({
          error: "Erro ao buscar steps do flow",
          details: stepsError?.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stepIds = allSteps.map((s) => s.id);

    // Buscar step_fields existentes
    const { data: existingFields, error: fieldsError } = await supabase
      .from("step_fields")
      .select("id, slug, step_id")
      .in("step_id", stepIds);

    if (fieldsError) {
      return new Response(
        JSON.stringify({
          error: "Erro ao buscar step_fields",
          details: fieldsError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar mapa de step_fields por slug
    const stepFieldsMap = new Map<string, { id: string; slug: string }>();
    for (const field of existingFields || []) {
      if (field.slug) {
        stepFieldsMap.set(field.slug, { id: field.id, slug: field.slug });
      }
    }

    // Arrays para resultados
    const results: ImportCardsCsvResponse["results"] = [];
    const errors: ImportCardsCsvResponse["errors"] = [];
    const createdFields: ImportCardsCsvResponse["createdFields"] = [];

    // Processar cada linha do CSV
    const batchSize = config.batchSize || DEFAULT_BATCH_SIZE;
    const productColumn = config.columnMapping.nativeFields?.product;
    const valueColumn = config.columnMapping.nativeFields?.value;
    const contactColumn = config.columnMapping.nativeFields?.contact;
    const companyColumn = config.columnMapping.nativeFields?.company;
    const productValueToExisting = config.productValueToExistingItem;

    // Se modo "valor para produto existente", buscar nome do item uma vez
    let productValueExistingItemInfo: { id: string; name: string; price: number | null } | null = null;
    if (productValueToExisting?.itemId) {
      const { data: existingItem } = await supabase
        .from("web_items")
        .select("id, name, price")
        .eq("id", productValueToExisting.itemId)
        .eq("client_id", clientId)
        .single();
      if (existingItem) {
        productValueExistingItemInfo = {
          id: existingItem.id,
          name: existingItem.name,
          price: existingItem.price ?? null,
        };
      }
    }

    const cardsByStep = new Map<
      string,
      Array<{ card: Record<string, unknown>; rowNumber: number; row: Record<string, string> }>
    >();

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const rowNumber = i + (skipHeader ? 2 : 1); // +1 para 1-indexed, +1 se pulou header

      try {
        const { card, stepId, errors: rowErrors } = await mapRowToCard(
          row,
          rowNumber,
          config,
          clientId,
          config.flowId,
          supabase,
          stepFieldsMap,
          createdFields
        );

        if (rowErrors.length > 0) {
          errors.push({
            rowNumber,
            error: rowErrors.join("; "),
            data: row,
          });
          results.push({
            rowNumber,
            status: "error",
            error: rowErrors.join("; "),
            stepId,
          });
          continue;
        }

        // Adicionar created_by
        card.created_by = userId;

        // Agrupar por step_id para batch insert (guardar row para criar card_items depois)
        if (!cardsByStep.has(stepId)) {
          cardsByStep.set(stepId, []);
        }
        cardsByStep.get(stepId)!.push({ card, rowNumber, row });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        errors.push({
          rowNumber,
          error: errorMessage,
          data: row,
        });
        results.push({
          rowNumber,
          status: "error",
          error: errorMessage,
          stepId: config.defaultStepId,
        });
      }
    }

    // Processar cards em batches por step
    for (const [stepId, cardsData] of cardsByStep.entries()) {
      // Buscar posição máxima inicial para o step
      let currentMaxPosition = await getMaxPositionForStep(supabase, stepId);

      // Processar em batches
      for (let i = 0; i < cardsData.length; i += batchSize) {
        const batch = cardsData.slice(i, i + batchSize);

        // Atribuir posições incrementais
        const cardsToInsert = batch.map((item, index) => ({
          ...item.card,
          position: currentMaxPosition + index + 1,
        }));

        // Atualizar posição máxima para próximo batch
        currentMaxPosition += batch.length;

        try {
          const { data: insertedCards, error: insertError } = await supabase
            .from("cards")
            .insert(cardsToInsert)
            .select("id");

          if (insertError) {
            // Erro no batch inteiro - marcar todos como erro
            for (const item of batch) {
              errors.push({
                rowNumber: item.rowNumber,
                error: `Erro ao inserir card: ${insertError.message}`,
                data: {},
              });
              results.push({
                rowNumber: item.rowNumber,
                status: "error",
                error: insertError.message,
                stepId,
              });
            }
          } else if (insertedCards) {
            // Sucesso - atualizar resultados e criar card_items quando produto mapeado
            for (let j = 0; j < batch.length; j++) {
              const cardId = insertedCards[j]?.id as string | undefined;
              const item = batch[j];
              if (!cardId) {
                errors.push({
                  rowNumber: item.rowNumber,
                  error: "Card inserido mas ID não retornado",
                  data: {},
                });
                results.push({
                  rowNumber: item.rowNumber,
                  status: "error",
                  error: "Card inserido mas ID não retornado",
                  stepId,
                });
                continue;
              }
              results.push({
                rowNumber: item.rowNumber,
                status: "success",
                cardId,
                stepId,
              });

              // Modo "produto por nome": coluna produto mapeada e linha tem valor → buscar/criar web_item e inserir card_item
              if (productColumn && item.row[productColumn]?.trim()) {
                const productName = item.row[productColumn].trim();
                let unitPrice: number | null = null;
                if (valueColumn && item.row[valueColumn]) {
                  const parsed = parseFloat(
                    item.row[valueColumn].replace(/[^\d.,-]/g, "").replace(",", ".")
                  );
                  if (!isNaN(parsed)) unitPrice = parsed;
                }
                const webItem = await findOrCreateWebItem(
                  supabase,
                  clientId,
                  productName,
                  unitPrice ?? undefined
                );
                if (webItem) {
                  const price = unitPrice ?? webItem.price ?? 0;
                  await supabase.from("card_items").insert({
                    card_id: cardId,
                    client_id: clientId,
                    item_id: webItem.id,
                    item_name: webItem.name,
                    unit_price: price,
                    total_price: price,
                    quantity: 1,
                  });
                }
              }

              // Modo "valor para produto existente": produto fixo + coluna com valor
              if (
                productValueToExisting &&
                productValueExistingItemInfo &&
                productValueToExisting.valueColumn
              ) {
                const valueStr = item.row[productValueToExisting.valueColumn];
                let unitPrice = productValueExistingItemInfo.price ?? 0;
                if (valueStr) {
                  const parsed = parseFloat(
                    valueStr.replace(/[^\d.,-]/g, "").replace(",", ".")
                  );
                  if (!isNaN(parsed)) unitPrice = parsed;
                }
                await supabase.from("card_items").insert({
                  card_id: cardId,
                  client_id: clientId,
                  item_id: productValueExistingItemInfo.id,
                  item_name: productValueExistingItemInfo.name,
                  unit_price: unitPrice,
                  total_price: unitPrice,
                  quantity: 1,
                });
              }

              // Contato: insert em card_contacts (contact_id já está no card; N:N mantido aqui)
              if (contactColumn && item.row[contactColumn]?.trim()) {
                const mainContactValue = item.row[contactColumn].trim();
                const clientNameValue = companyColumn
                  ? item.row[companyColumn]?.trim()
                  : undefined;
                const contact = await findOrCreateContact(
                  supabase,
                  clientId,
                  mainContactValue,
                  clientNameValue
                );
                if (contact) {
                  await supabase.from("card_contacts").insert({
                    card_id: cardId,
                    contact_id: contact.id,
                    client_id: clientId,
                  });
                }
              }
            }
          }
        } catch (error) {
          // Erro ao processar batch
          const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
          for (const item of batch) {
            errors.push({
              rowNumber: item.rowNumber,
              error: errorMessage,
              data: {},
            });
            results.push({
              rowNumber: item.rowNumber,
              status: "error",
              error: errorMessage,
              stepId,
            });
          }
        }
      }
    }

    // Calcular estatísticas
    const successfulImports = results.filter((r) => r.status === "success").length;
    const failedImports = results.filter((r) => r.status === "error").length;

    // Preparar resposta
    const response: ImportCardsCsvResponse = {
      success: true,
      summary: {
        totalRows: csvRows.length,
        successfulImports,
        failedImports,
        createdFields: createdFields.length,
      },
      results,
      createdFields: createdFields.length > 0 ? createdFields : undefined,
      errors: errors.length > 0 ? errors : undefined,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Erro na Edge Function:", error);
    return new Response(
      JSON.stringify({
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

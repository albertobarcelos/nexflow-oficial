import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-expect-error - JSR modules are resolved at runtime by Deno
import { createClient } from "jsr:@supabase/supabase-js@2";

// Declaração de tipo para Deno (necessário para TypeScript no editor)
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RateLimitStore {
  [key: string]: number[];
}

// Rate limiting simples em memória (em produção, usar Redis)
const rateLimitStore: RateLimitStore = {};

function checkRateLimit(ip: string, maxRequests: number = 5, windowMs: number = 3600000): boolean {
  const now = Date.now();
  const key = ip;
  
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = [];
  }
  
  // Remover requisições antigas
  rateLimitStore[key] = rateLimitStore[key].filter(
    (timestamp) => now - timestamp < windowMs
  );
  
  // Verificar se excedeu o limite
  if (rateLimitStore[key].length >= maxRequests) {
    return false;
  }
  
  // Adicionar requisição atual
  rateLimitStore[key].push(now);
  return true;
}

function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    // Remover caracteres perigosos e limitar tamanho
    return input
      .trim()
      .slice(0, 10000)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput).filter((item) => item !== null && item !== undefined);
  }
  if (typeof input === "object" && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Muitas requisições. Tente novamente mais tarde." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { formData, slug } = await req.json();

    if (!slug || !formData) {
      return new Response(
        JSON.stringify({ error: "Slug e dados do formulário são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar cliente Supabase com service role para bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Buscar formulário pelo slug
    const { data: form, error: formError } = await supabaseAdmin
      .from("public_opportunity_forms")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (formError || !form) {
      return new Response(
        JSON.stringify({ error: "Formulário não encontrado ou inativo" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar campos obrigatórios baseado na configuração
    const requiredFields = form.fields_config
      .filter((field: any) => field.required)
      .map((field: any) => field.name);

    const missingFields = requiredFields.filter(
      (field: string) => !formData[field] || formData[field].toString().trim() === ""
    );

    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Campos obrigatórios não preenchidos",
          missingFields,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sanitizar dados
    const sanitizedData = sanitizeInput(formData);

    // Função auxiliar para validar CPF/CNPJ
    function validateCpfCnpj(value: string): boolean {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length === 11) {
        // Validar CPF
        if (/^(\d)\1{10}$/.test(cleaned)) return false;
        let sum = 0;
        for (let i = 1; i <= 9; i++) {
          sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
        sum = 0;
        for (let i = 1; i <= 10; i++) {
          sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        return remainder === parseInt(cleaned.substring(10, 11));
      } else if (cleaned.length === 14) {
        // Validar CNPJ
        if (/^(\d)\1{13}$/.test(cleaned)) return false;
        let length = 12;
        let numbers = cleaned.substring(0, length);
        const digits = cleaned.substring(length);
        let sum = 0;
        let pos = length - 7;
        for (let i = length; i >= 1; i--) {
          sum += parseInt(numbers.charAt(length - i)) * pos--;
          if (pos < 2) pos = 9;
        }
        let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (result !== parseInt(digits.charAt(0))) return false;
        length = 13;
        numbers = cleaned.substring(0, length);
        sum = 0;
        pos = length - 7;
        for (let i = length; i >= 1; i--) {
          sum += parseInt(numbers.charAt(length - i)) * pos--;
          if (pos < 2) pos = 9;
        }
        result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        return result === parseInt(digits.charAt(1));
      }
      return false;
    }

    // Validar CPF/CNPJ se presente
    for (const field of form.fields_config) {
      if (field.type === "cpf_cnpj" && sanitizedData[field.name]) {
        const isValid = validateCpfCnpj(sanitizedData[field.name]);
        if (!isValid) {
          return new Response(
            JSON.stringify({
              error: `CPF/CNPJ inválido no campo ${field.label}`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    // Extrair campos padrão da oportunidade
    const clientName = sanitizedData.client_name || sanitizedData.name || "";
    const mainContact = sanitizedData.main_contact || sanitizedData.contact || "";
    const phoneNumbers = sanitizedData.phone_numbers
      ? Array.isArray(sanitizedData.phone_numbers)
        ? sanitizedData.phone_numbers
        : [sanitizedData.phone_numbers]
      : sanitizedData.phone
      ? [sanitizedData.phone]
      : [];
    const companyNames = sanitizedData.company_names
      ? Array.isArray(sanitizedData.company_names)
        ? sanitizedData.company_names
        : [sanitizedData.company_names]
      : sanitizedData.company
      ? [sanitizedData.company]
      : [];
    const taxIds = sanitizedData.tax_ids
      ? Array.isArray(sanitizedData.tax_ids)
        ? sanitizedData.tax_ids
        : [sanitizedData.tax_ids]
      : sanitizedData.cnpj || sanitizedData.cpf
      ? [sanitizedData.cnpj || sanitizedData.cpf]
      : [];

    // Extrair campos especiais
    let companyId: string | null = null;
    let partnerId: string | null = null;
    let userId: string | null = null;

    for (const field of form.fields_config) {
      if (field.type === "company_toggle" && sanitizedData[field.name]) {
        companyId = sanitizedData[field.name];
      }
      if (field.type === "partner_select" && sanitizedData[field.name]) {
        partnerId = sanitizedData[field.name];
      }
      if (field.type === "user_select" && sanitizedData[field.name]) {
        userId = sanitizedData[field.name];
      }
    }

    // Validar campos obrigatórios padrão
    if (!clientName || !mainContact) {
      return new Response(
        JSON.stringify({
          error: "Nome do cliente e contato principal são obrigatórios",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar contato no schema public
    const { data: contact, error: contactError } = await supabaseAdmin
      .from("contacts")
      .insert({
        client_id: form.client_id,
        client_name: clientName,
        main_contact: mainContact,
        phone_numbers: phoneNumbers.length > 0 ? phoneNumbers : null,
        company_names: companyNames.length > 0 ? companyNames : null,
        tax_ids: taxIds.length > 0 ? taxIds : null,
        indicated_by: partnerId || null,
      })
      .select()
      .single();

    if (contactError || !contact) {
      console.error("Erro ao criar contato:", contactError);
      return new Response(
        JSON.stringify({
          error: "Erro ao processar formulário. Tente novamente mais tarde.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Vincular empresa se selecionada
    if (companyId) {
      const { error: companyError } = await supabaseAdmin
        .from("contact_companies")
        .insert({
          contact_id: contact.id,
          company_id: companyId,
          client_id: form.client_id,
          role: null,
        });

      if (companyError) {
        console.error("Erro ao vincular empresa:", companyError);
        // Não falhar o processo, apenas logar o erro
      }
    }

    // Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: form.settings?.successMessage || "Formulário enviado com sucesso!",
        contactId: contact.id,
        companyId: companyId || null,
        partnerId: partnerId || null,
        userId: userId || null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na Edge Function:", error);
    return new Response(
      JSON.stringify({
        error: "Erro interno do servidor. Tente novamente mais tarde.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});


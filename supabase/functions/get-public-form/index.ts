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

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response(
        JSON.stringify({ error: "Slug é obrigatório" }),
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

    // Buscar formulário público pelo slug (sem expor o token)
    // Apenas retornar formulários públicos (form_type = 'public' ou NULL para compatibilidade)
    const { data: form, error: formError } = await supabaseAdmin
      .from("public_opportunity_forms")
      .select("id, title, description, slug, fields_config, settings, is_active, form_type, requires_auth")
      .eq("slug", slug)
      .eq("is_active", true)
      .or("form_type.is.null,form_type.eq.public")
      .single();

    if (formError || !form) {
      return new Response(
        JSON.stringify({ error: "Formulário público não encontrado ou inativo" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Garantir que não retornamos formulários internos por engano
    if (form.form_type === "internal") {
      return new Response(
        JSON.stringify({ error: "Este formulário requer autenticação. Use a rota de formulários internos." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Retornar apenas dados necessários (sem token)
    return new Response(
      JSON.stringify({
        id: form.id,
        title: form.title,
        description: form.description,
        slug: form.slug,
        fields_config: form.fields_config,
        settings: form.settings,
        form_type: form.form_type || "public",
        requires_auth: form.requires_auth ?? (form.form_type === "internal"),
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


import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  collaboratorId: string;
  name: string;
  email: string;
  inviteUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    const { collaboratorId, name, email, inviteUrl }: InviteRequest = await req.json();
    console.log("Received invite request:", { collaboratorId, name, email, inviteUrl });

    // Generate invite token and save it
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

    console.log("Creating invite with token:", token);
    const { error: inviteError } = await supabase
      .from('collaborator_invites')
      .insert({
        collaborator_id: collaboratorId,
        token: token,
        expires_at: expiresAt.toISOString(),
      });

    if (inviteError) {
      console.error("Error creating invite:", inviteError);
      throw new Error("Failed to create invite");
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    console.log("Sending email via Resend");
    // Send email using Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Portal CRM <noreply@seu-dominio.com>",
        to: [email],
        subject: "Convite para o Portal CRM",
        html: `
          <h2>Olá ${name}!</h2>
          <p>Você foi convidado para acessar o Portal CRM.</p>
          <p>Para configurar sua senha e acessar o sistema, clique no link abaixo:</p>
          <p><a href="${inviteUrl}?token=${token}">Configurar minha senha</a></p>
          <p>Este link expira em 24 horas.</p>
          <p>Se você não solicitou este convite, por favor ignore este email.</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
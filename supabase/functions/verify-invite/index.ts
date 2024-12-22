import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  token: string;
  password: string;
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

    const { token, password }: VerifyRequest = await req.json();

    // Get invite and related collaborator
    const { data: invite, error: inviteError } = await supabase
      .from('collaborator_invites')
      .select(`
        *,
        collaborators (
          id,
          email,
          name
        )
      `)
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (inviteError || !invite) {
      throw new Error("Invalid or expired invite");
    }

    // Check if invite is expired
    if (new Date(invite.expires_at) < new Date()) {
      throw new Error("Invite has expired");
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invite.collaborators.email,
      password: password,
      email_confirm: true,
    });

    if (authError) {
      throw new Error("Failed to create user account");
    }

    // Update collaborator with auth_user_id
    const { error: updateError } = await supabase
      .from('collaborators')
      .update({ auth_user_id: authData.user.id })
      .eq('id', invite.collaborator_id);

    if (updateError) {
      throw new Error("Failed to update collaborator");
    }

    // Mark invite as used
    const { error: markUsedError } = await supabase
      .from('collaborator_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invite.id);

    if (markUsedError) {
      throw new Error("Failed to mark invite as used");
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in verify-invite function:", error);
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
import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginCredentials } from "@/types/auth";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const CRMLogin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      
      // Clear any existing session
      await supabase.auth.signOut();
      
      // Attempt to sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) throw authError;

      // Check if the user is a collaborator
      const { data: collaboratorData, error: collaboratorError } = await supabase
        .from('collaborators')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();

      if (collaboratorError) throw collaboratorError;
      
      if (!collaboratorData) {
        throw new Error('Usuário não autorizado para acessar o portal CRM.');
      }

      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao Portal CRM",
      });

      navigate("/crm/dashboard");
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao tentar fazer login.",
        variant: "destructive",
      });
      
      // Ensure we're signed out on error
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Portal CRM</h1>
          <p className="text-gray-600 mt-2">Portal de Colaboradores</p>
        </div>
        <LoginForm 
          portalName="Portal CRM" 
          onSubmit={handleLogin}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default CRMLogin;
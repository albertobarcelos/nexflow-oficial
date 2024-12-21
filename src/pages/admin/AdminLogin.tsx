import { useState } from 'react';
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginCredentials } from "@/types/auth";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      
      // First try to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (signInError) {
        // If sign in fails, check if it's because the user doesn't exist
        if (signInError.message.includes('Invalid login credentials')) {
          toast({
            title: "Erro de autenticação",
            description: "Email ou senha inválidos.",
            variant: "destructive",
          });
        } else {
          throw signInError;
        }
        return;
      }

      // Check if the email exists in the administrators table
      const { data: adminData, error: adminError } = await supabase
        .from('administrators')
        .select('id, name, access_level')
        .eq('email', credentials.email)
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut(); // Sign out if not an admin
        toast({
          title: "Acesso negado",
          description: "Esta conta não tem permissão de administrador.",
          variant: "destructive",
        });
        return;
      }

      // Successfully authenticated as admin
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo(a), ${adminData.name}!`,
      });

      // Navigate to admin dashboard (you'll need to create this route)
      navigate('/admin/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro ao tentar fazer login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Portal Administrador</h1>
          <p className="text-gray-600 mt-2">OEM Nexsyn</p>
        </div>
        <LoginForm 
          portalName="Portal Administrador" 
          onSubmit={handleLogin}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default AdminLogin;
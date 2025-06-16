import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Fazer login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Verificar se o usuário é um administrador do sistema (role = 'administrator')
      const { data: adminData, error: adminError } = await supabase
        .from('core_client_users')
        .select(`
          id,
          client_id,
          first_name,
          last_name,
          email,
          role,
          is_active
        `)
        .eq('id', authData.user.id)
        .eq('role', 'administrator')
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        throw new Error('Acesso não autorizado. Você não tem permissão para acessar o portal administrativo.');
      }

      // Atualizar último login
      await supabase
        .from('core_client_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', authData.user.id);

      toast.success(`Bem-vindo(a) ao Portal Administrativo, ${adminData.first_name} ${adminData.last_name}!`);
      navigate("/admin");
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      
      let errorMessage = "Erro ao fazer login. Tente novamente.";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.message?.includes('não autorizado')) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Portal Administrativo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Gerencie todos os clientes e configurações do sistema
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-sm"
            >
              Voltar para seleção
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 

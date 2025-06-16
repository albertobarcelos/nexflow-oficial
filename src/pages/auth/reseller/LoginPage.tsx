import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Building2, Mail, Lock, Eye, EyeOff, Users } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = "Email é obrigatório";
    } else if (!validateEmail(email)) {
      newErrors.email = "Email inválido";
    }
    
    if (!password) {
      newErrors.password = "Senha é obrigatória";
    } else if (password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateForm();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Fazer login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Verificar se o usuário é um revendedor ativo
      const { data: resellerData, error: resellerError } = await supabase
        .from('core_reseller_users')
        .select(`
          id,
          reseller_id,
          first_name,
          last_name,
          email,
          role,
          is_active,
          reseller:core_resellers!reseller_id (
            id,
            name,
            company_name,
            status
          )
        `)
        .eq('id', authData.user.id)
        .eq('is_active', true)
        .single();

      if (resellerError || !resellerData) {
        await supabase.auth.signOut();
        throw new Error('Acesso não autorizado. Você não tem permissão para acessar o portal de revendedores.');
      }

      // Verificar se o revendedor está ativo
      if (resellerData.reseller?.status !== 'active') {
        await supabase.auth.signOut();
        throw new Error('Sua conta de revendedor está inativa. Entre em contato com o suporte.');
      }

      // Atualizar último login
      await supabase
        .from('core_reseller_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', authData.user.id);

      toast.success(`Bem-vindo(a) ao Portal de Revendedores, ${resellerData.first_name} ${resellerData.last_name}!`);
      navigate("/reseller");
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      
      let errorMessage = "Erro ao fazer login. Tente novamente.";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.message?.includes('não autorizado')) {
        errorMessage = error.message;
      } else if (error.message?.includes('inativa')) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        {/* Card Principal */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          {/* Logo e Título */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Portal de Revendedores
            </h1>
            <p className="text-gray-600 text-sm">
              Gerencie seus clientes e acompanhe suas vendas
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Campo Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`pl-10 ${errors.email && touched.email ? 'border-red-500 focus:border-red-500' : ''}`}
                  disabled={loading}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {errors.email && touched.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`pl-10 pr-10 ${errors.password && touched.password ? 'border-red-500 focus:border-red-500' : ''}`}
                  disabled={loading}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Botões */}
            <div className="space-y-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" />
                    Entrar no Portal
                  </div>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/")}
                className="w-full text-gray-600 hover:text-gray-800 font-medium py-2.5"
                disabled={loading}
              >
                Voltar para seleção
              </Button>
            </div>
          </form>

          {/* Informações de Suporte */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              Problemas para acessar? Entre em contato com o suporte
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
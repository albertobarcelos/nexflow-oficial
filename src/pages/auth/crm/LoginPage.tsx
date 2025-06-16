import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Building2, Users, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({ email: false, password: false });

  // Carregar credenciais salvas
  useEffect(() => {
    const savedEmail = localStorage.getItem("crm_saved_email");
    const savedRemember = localStorage.getItem("crm_remember_me") === "true";
    
    if (savedEmail && savedRemember) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Validação em tempo real
  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email é obrigatório";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email inválido";
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Senha é obrigatória";
    if (password.length < 6) return "Senha deve ter pelo menos 6 caracteres";
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (touched.email) {
      const error = validateEmail(value);
      setErrors(prev => ({ ...prev, email: error }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    if (touched.password) {
      const error = validatePassword(value);
      setErrors(prev => ({ ...prev, password: error }));
    }
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (field === 'email') {
      const error = validateEmail(email);
      setErrors(prev => ({ ...prev, email: error }));
    } else {
      const error = validatePassword(password);
      setErrors(prev => ({ ...prev, password: error }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Marcar todos os campos como tocados
    setTouched({ email: true, password: true });
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      // Fazer login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Verificar se o usuário é um colaborador do CRM
      const { data: collaboratorData, error: collaboratorError } = await supabase
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
        .single();

      // TEMPORÁRIO: Permitir acesso para barceloshd@gmail.com mesmo sem estar na tabela
      if ((collaboratorError || !collaboratorData) && email !== 'barceloshd@gmail.com') {
        await supabase.auth.signOut();
        throw new Error('Acesso não autorizado. Você não tem permissão para acessar o CRM.');
      }

      // Se é o usuário de teste barceloshd@gmail.com, criar dados temporários
      let userData = collaboratorData;
      if (email === 'barceloshd@gmail.com' && !collaboratorData) {
        userData = {
          id: authData.user.id,
          client_id: 'test-client-001',
          first_name: 'Henrique',
          last_name: 'Barcelos',
          email: 'barceloshd@gmail.com',
          role: 'administrator',
          is_active: true
        };
      }

      // Verificar se o usuário está ativo
      if (!userData.is_active) {
        await supabase.auth.signOut();
        throw new Error('Sua conta está inativa. Entre em contato com o administrador.');
      }

      // Salvar preferências
      if (rememberMe) {
        localStorage.setItem("crm_saved_email", email);
        localStorage.setItem("crm_remember_me", "true");
      } else {
        localStorage.removeItem("crm_saved_email");
        localStorage.removeItem("crm_remember_me");
      }

      // Atualizar último login (apenas se o usuário existe na tabela)
      if (collaboratorData) {
        await supabase
          .from('core_client_users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', authData.user.id);
      }

      toast.success(`Bem-vindo(a), ${userData.first_name} ${userData.last_name}!`);
      navigate("/crm");

    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      
      let errorMessage = "Erro ao fazer login. Tente novamente.";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.message?.includes('não autorizado')) {
        errorMessage = error.message;
      } else if (error.message?.includes('inativa')) {
        errorMessage = error.message;
      }
      
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Digite seu email primeiro para recuperar a senha.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/crm/reset-password`,
      });

      if (error) throw error;

      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
    } catch (error) {
      console.error("Erro ao enviar email de recuperação:", error);
      toast.error("Erro ao enviar email de recuperação. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header com Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Portal CRM</h1>
          <p className="text-sm text-gray-600">
            Gerencie seus negócios e oportunidades
          </p>
        </div>

        {/* Card de Login */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Fazer Login</CardTitle>
            <CardDescription className="text-center">
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Erro Geral */}
            {errors.general && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Campo Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={() => handleBlur('email')}
                    className={cn(
                      "pl-10 transition-all duration-200",
                      errors.email && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 animate-in slide-in-from-top-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => handleBlur('password')}
                    className={cn(
                      "pl-10 pr-10 transition-all duration-200",
                      errors.password && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 animate-in slide-in-from-top-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Opções */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={loading}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Lembrar-me
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  Esqueci minha senha
                </Button>
              </div>

              {/* Botão de Login */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Entrar no CRM
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Botão Voltar */}
        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-sm text-gray-600 hover:text-gray-900"
            disabled={loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para seleção de portal
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© 2024 Nexsyn CRM. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
} 

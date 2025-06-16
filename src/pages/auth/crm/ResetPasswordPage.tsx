import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, ArrowLeft, Building2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Verificar se há uma sessão válida para reset de senha
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        toast.error("Link de recuperação inválido ou expirado.");
        navigate("/crm/login");
      }
    };

    checkSession();
  }, [navigate]);

  // Validação em tempo real
  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Nova senha é obrigatória";
    if (password.length < 8) return "Senha deve ter pelo menos 8 caracteres";
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return "Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número";
    }
    return undefined;
  };

  const validateConfirmPassword = (confirmPassword: string): string | undefined => {
    if (!confirmPassword) return "Confirmação de senha é obrigatória";
    if (confirmPassword !== password) return "Senhas não coincidem";
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    
    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    if (touched.password) {
      const error = validatePassword(value);
      setErrors(prev => ({ ...prev, password: error }));
    }
    
    // Revalidar confirmação se já foi tocada
    if (touched.confirmPassword && confirmPassword) {
      const confirmError = value !== confirmPassword ? "Senhas não coincidem" : undefined;
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    if (touched.confirmPassword) {
      const error = validateConfirmPassword(value);
      setErrors(prev => ({ ...prev, confirmPassword: error }));
    }
  };

  const handleBlur = (field: 'password' | 'confirmPassword') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (field === 'password') {
      const error = validatePassword(password);
      setErrors(prev => ({ ...prev, password: error }));
    } else {
      const error = validateConfirmPassword(confirmPassword);
      setErrors(prev => ({ ...prev, confirmPassword: error }));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Marcar todos os campos como tocados
    setTouched({ password: true, confirmPassword: true });
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success("Senha alterada com sucesso! Você será redirecionado para o login.");
      
      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        navigate("/crm/login");
      }, 2000);

    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      
      let errorMessage = "Erro ao alterar senha. Tente novamente.";
      
      if (error.message?.includes('session_not_found')) {
        errorMessage = "Sessão expirada. Solicite um novo link de recuperação.";
      }
      
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verificando link de recuperação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header com Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Redefinir Senha</h1>
          <p className="text-sm text-gray-600">
            Digite sua nova senha para acessar o CRM
          </p>
        </div>

        {/* Card de Reset */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Nova Senha</CardTitle>
            <CardDescription className="text-center">
              Escolha uma senha forte para proteger sua conta
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

            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Campo Nova Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Nova Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua nova senha"
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

              {/* Campo Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmar Nova Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={cn(
                      "pl-10 pr-10 transition-all duration-200",
                      errors.confirmPassword && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 animate-in slide-in-from-top-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Dicas de Segurança */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Dicas para uma senha segura:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Pelo menos 8 caracteres</li>
                      <li>• Uma letra maiúscula e uma minúscula</li>
                      <li>• Pelo menos um número</li>
                      <li>• Evite informações pessoais</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botão de Redefinir */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Alterando senha...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Redefinir Senha
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
            onClick={() => navigate("/crm/login")}
            className="text-sm text-gray-600 hover:text-gray-900"
            disabled={loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o login
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
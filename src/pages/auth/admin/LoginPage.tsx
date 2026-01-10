import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Schema de validação com Zod
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginPage.tsx:onSubmit:start',message:'Admin login iniciado',data:{email:values.email,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // 1. Login no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginPage.tsx:onSubmit:authResult',message:'Admin auth resultado',data:{hasAuthData:!!authData,hasUser:!!authData?.user,userId:authData?.user?.id,hasError:!!authError,errorMessage:authError?.message,errorCode:authError?.status,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (authError) {
        throw new Error("Credenciais inválidas.");
      }

      // 2. Validação de Segurança (RPC)
      // Retry logic para contornar erro PGRST002 (cache do schema corrompido)
      let rpcData = null;
      let rpcError = null;
      const maxRetries = 5; // Aumentado para 5 tentativas
      let retryCount = 0;
      
      while (retryCount < maxRetries && !rpcData && (!rpcError || rpcError?.code === 'PGRST002')) {
        if (retryCount > 0) {
          // Aguardar antes de tentar novamente (exponencial backoff - até 5 segundos)
          const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        const result = await (supabase.rpc as any)(
          "check_admin_access"
        ) as { data: { allowed: boolean; error?: string; user?: { name: string; surname: string } } | null; error: any };
        
        rpcData = result.data;
        rpcError = result.error;
        retryCount++;
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/161cbf26-47b2-4a4e-a3dd-0e1bec2ffe55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginPage.tsx:onSubmit:rpcResult',message:'check_admin_access RPC resultado',data:{hasRpcData:!!rpcData,allowed:rpcData?.allowed,error:rpcData?.error,hasRpcError:!!rpcError,rpcErrorMessage:rpcError?.message,rpcErrorCode:rpcError?.code,userId:authData?.user?.id,retryCount,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      }

      if (rpcError || !rpcData || !rpcData.allowed) {
        // Se falhar na validação de role, desloga imediatamente para não manter sessão aberta
        await supabase.auth.signOut();
        throw new Error(
          rpcData?.error || "Acesso restrito a administradores."
        );
      }

      // 3. Sucesso
      if (rpcData.user) {
        toast.success(`Bem-vindo, ${rpcData.user.name}!`);
      }
      navigate("/admin");
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      toast.error(error.message || "Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            Portal Administrativo
          </CardTitle>
          <CardDescription className="text-center">
            Gerencie todos os clientes e configurações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          autoComplete="email"
                          className="pl-9"
                          disabled={isLoading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="pl-9"
                          disabled={isLoading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-sm"
            disabled={isLoading}
          >
            Voltar para seleção
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 

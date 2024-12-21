import { LoginForm } from "@/components/auth/LoginForm";
import { LoginCredentials } from "@/types/auth";
import { useToast } from "@/components/ui/use-toast";

const CRMLogin = () => {
  const { toast } = useToast();

  const handleLogin = async (credentials: LoginCredentials) => {
    // TODO: Implement actual login logic
    console.log("CRM login attempt:", credentials);
    
    toast({
      title: "Login em desenvolvimento",
      description: "Funcionalidade será implementada em breve.",
    });
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
        />
      </div>
    </div>
  );
};

export default CRMLogin;
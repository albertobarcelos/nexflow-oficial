import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Info, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlowTemplates } from "@/components/crm/flows/FlowTemplates";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

type UserData = {
    client_id: string;
    first_name?: string;
};

type Flow = {
    id: string;
    name: string;
    description: string | null;
};

// Função helper para obter dados do usuário (incluindo usuário de teste)
const getCurrentUserData = async (): Promise<UserData> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    try {
        // Tentar buscar na tabela core_client_users
        const { data, error } = await supabase
            .from('core_client_users')
            .select(`
                client_id,
                core_clients (
                    contact_name
                )
            `)
            .eq('user_id', user.id)
            .single();

        if (error) throw error;
        if (data) {
            return {
                client_id: data.client_id,
                first_name: data.core_clients?.contact_name
            };
        }

        // Se não encontrou e é o usuário de teste, retorna dados temporários
        if (user.email === 'barceloshd@gmail.com') {
            return {
                client_id: 'test-client-001',
                first_name: 'usuário'
            };
        }

        throw new Error("Colaborador não encontrado");
    } catch (error) {
        console.error('Error fetching user data:', error);
        return {
            client_id: 'unknown',
            first_name: 'usuário'
        };
    }
};

export function Home() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [showTemplates, setShowTemplates] = useState(false);
    const [newFlowTitle, setNewFlowTitle] = useState<string | null>(null);
    const isMobile = useIsMobile();

    const { data: user } = useQuery<UserData>({
        queryKey: ["user"],
        queryFn: getCurrentUserData,
    });

    const { data: flows } = useQuery<Flow[]>({
        queryKey: ["flows", user?.client_id],
        queryFn: async () => {
            if (!user?.client_id) return [];
            const { data, error } = await supabase
                .from('web_flows')
                .select('id, name, description')
                .eq('client_id', user.client_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!user?.client_id
    });

    const handleSelectTemplate = (templateId: string) => {
        // TODO: Implement template selection logic
        console.log('Selected template:', templateId);
        setShowTemplates(false);
    };

    return (
        <div className="min-h-screen bg-[#f8faff] p-4 md:p-8">
            <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
                    <h1 className="text-xl md:text-2xl">
                        <span className="font-bold">Olá, {user?.first_name || 'usuário'}</span>, vamos arrasar hoje!
                    </h1>
                    {!isMobile && (
                        <Button variant="ghost" className="bg-blue-50 text-blue-900 hover:bg-blue-100 rounded-full px-4 py-2 text-sm gap-2 w-fit">
                            🎯 Minhas Tarefas
                        </Button>
                    )}
                </div>

                <div className="space-y-6 md:space-y-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-base md:text-lg font-medium">Flows</h2>
                            <Info className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                            <div
                                onClick={() => setShowTemplates(true)}
                                className="border border-orange-500 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center space-y-2 md:space-y-3 cursor-pointer hover:bg-orange-50/50 min-h-[100px] md:min-h-[120px]"
                            >
                                <Plus className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                                <span className="text-orange-500 text-xs md:text-sm text-center">Criar Flow</span>
                            </div>
                            {flows?.map((flow) => (
                                <div
                                    key={flow.id}
                                    className="bg-[#F1F3F9] rounded-xl p-4 md:p-6 cursor-pointer hover:bg-[#E9EBF1] min-h-[100px] md:min-h-[120px]"
                                    onClick={() => navigate(`/crm/flow/${flow.id}`)}
                                >
                                    <div className="space-y-1 md:space-y-2">
                                        <h3 className="text-xs md:text-sm font-medium line-clamp-2">{flow.name}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 hidden sm:block">{flow.description || 'Sem descrição'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-base md:text-lg font-medium">Bases</h2>
                            <Info className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                            <div className="border border-orange-500 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center space-y-2 md:space-y-3 cursor-pointer hover:bg-orange-50/50 min-h-[100px] md:min-h-[120px]">
                                <Plus className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                                <span className="text-orange-500 text-xs md:text-sm text-center">Criar Base</span>
                            </div>
                            <div
                                className="bg-[#F1F3F9] rounded-xl p-4 md:p-6 cursor-pointer hover:bg-[#E9EBF1] min-h-[100px] md:min-h-[120px]"
                                onClick={() => navigate("/crm/contacts")}
                            >
                                <div className="space-y-1 md:space-y-2">
                                    <h3 className="text-xs md:text-sm font-medium">Contatos</h3>
                                    <p className="text-xs text-gray-500">0 contatos</p>
                                </div>
                            </div>
                            <div
                                className="bg-[#F1F3F9] rounded-xl p-4 md:p-6 cursor-pointer hover:bg-[#E9EBF1] min-h-[100px] md:min-h-[120px]"
                                onClick={() => navigate("/crm/companies")}
                            >
                                <div className="space-y-1 md:space-y-2">
                                    <h3 className="text-xs md:text-sm font-medium">Empresas</h3>
                                    <p className="text-xs text-gray-500">0 empresas</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ações rápidas em mobile */}
                    {isMobile && (
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => navigate("/crm/tasks")}
                            >
                                🎯 Tarefas
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => navigate("/crm/dashboard")}
                            >
                                📊 Dashboard
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <FlowTemplates
                open={showTemplates}
                onOpenChange={setShowTemplates}
                onSelectTemplate={handleSelectTemplate}
                onSetNewFlowTitle={setNewFlowTitle}
            />
        </div>
    );
}


import { FlowTemplates } from "@/components/crm/flows/FlowTemplates";
// AIDEV-NOTE: EntityTemplates removido - sistema simplificado sem entidades dinâmicas
import { ConfigurationDropdown } from "@/components/crm/flows/ConfigurationDropdown";
// AIDEV-NOTE: EntityConfigurationDropdown removido - sistema simplificado sem entidades dinâmicas
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
// AIDEV-NOTE: Removido useEntities - sistema simplificado sem entidades dinâmicas

type UserData = {
    client_id: string;
    first_name?: string;
};

type Flow = {
    id: string;
    name: string;
    description: string | null;
};

type Entity = {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    color: string;
    count?: number;
    table?: string;
};

// Função helper para obter dados do usuário
const getCurrentUserData = async (): Promise<UserData> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // A função agora busca diretamente pelo ID do usuário
    const { data, error } = await supabase
        .from('core_client_users')
        .select('client_id, first_name')
        .eq('id', user.id) // CORRIGIDO: usa a coluna 'id'
        .single();

    if (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }

    if (!data) {
        throw new Error("Dados do colaborador não encontrados.");
    }

    return {
        client_id: data.client_id,
        first_name: data.first_name
    };
};

export function Home() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [showTemplates, setShowTemplates] = useState(false);
    // AIDEV-NOTE: showEntityTemplates removido - sistema simplificado sem entidades dinâmicas
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

    // AIDEV-NOTE: Entidades dinâmicas removidas - sistema simplificado
    // Agora focamos apenas em Companies, People e Deals fixos
    const entities: Entity[] = [];

    const handleSelectTemplate = (templateId: string) => {
        // TODO: Implement template selection logic
        console.log('Selected template:', templateId);
        setShowTemplates(false);
    };

    // Ícones para entidades
    const getEntityIcon = (iconName: string) => {
        const iconMap: Record<string, string> = {
            'database': '🗃️',
            'building2': '🏢',
            'users': '👥',
            'package': '📦',
            'home': '🏠',
            'car': '🚗',
            'graduation-cap': '🎓',
            'briefcase': '💼',
            'heart': '❤️',
            'shopping-cart': '🛒'
        };
        return iconMap[iconName] || '🗃️';
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
                                    className="bg-[#F1F3F9] rounded-xl p-4 md:p-6 cursor-pointer hover:bg-[#E9EBF1] min-h-[100px] md:min-h-[120px] relative group"
                                >
                                    <div
                                        className="space-y-1 md:space-y-2 h-full"
                                        onClick={() => navigate(`/crm/flow/${flow.id}`)}
                                    >
                                        <h3 className="text-xs md:text-sm font-medium line-clamp-2">{flow.name}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 hidden sm:block">{flow.description || 'Sem descrição'}</p>
                                    </div>

                                    {/* Botão de configuração */}
                                    <div
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ConfigurationDropdown
                                            flowId={flow.id}
                                            flowName={flow.name}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-base md:text-lg font-medium">Bases de Dados</h2>
                            <Info className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                            <div
                                className="border border-gray-300 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center space-y-2 md:space-y-3 cursor-not-allowed opacity-50 min-h-[100px] md:min-h-[120px]"
                                title="Funcionalidade removida - sistema simplificado para deals"
                            >
                                <Plus className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                                <span className="text-gray-400 text-xs md:text-sm text-center">Criar Base (Desabilitado)</span>
                            </div>
                            {/* Link para EntityPage de mock, só em dev */}
                            {process.env.NODE_ENV === 'development' && (
                                <Button
                                    variant="outline"
                                    className="rounded-xl p-4 md:p-6 flex flex-col items-center justify-center space-y-2 md:space-y-3 min-h-[100px] md:min-h-[120px] border border-blue-400 text-blue-700 hover:bg-blue-50"
                                    onClick={() => navigate('/crm/entity/mock')}
                                    style={{ gridColumn: 'auto' }}
                                >
                                    <span className="text-lg">🧪</span>
                                    <span className="text-xs md:text-sm text-center">Abrir Mock EntityPage</span>
                                </Button>
                            )}
                            {/* Entidades dinâmicas */}
                            {entities?.map((entity) => (
                                <div
                                    key={entity.id}
                                    className="rounded-xl p-4 md:p-6 cursor-pointer hover:shadow-md transition-all min-h-[100px] md:min-h-[120px] relative overflow-hidden group"
                                    style={{
                                        backgroundColor: `${entity.color}10`,
                                        borderLeft: `4px solid ${entity.color}`
                                    }}
                                >
                                    <div
                                        className="space-y-1 md:space-y-2 h-full"
                                        onClick={() => navigate(`/crm/entity/${entity.id}`)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{getEntityIcon(entity.icon)}</span>
                                            <h3 className="text-xs md:text-sm font-medium line-clamp-1" style={{ color: entity.color }}>
                                                {entity.name}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 hidden sm:block">
                                            {entity.description || 'Sem descrição'}
                                        </p>
                                        <p className="text-xs font-medium" style={{ color: entity.color }}>
                                            {entity.count || 0} registros
                                        </p>
                                    </div>

                                    {/* Botão de configuração */}
                                    {/* AIDEV-NOTE: EntityConfigurationDropdown removido - sistema simplificado para deals */}
                                </div>
                            ))}
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
            />

            {/* AIDEV-NOTE: EntityTemplates removido - sistema simplificado para deals */}
        </div>
    );
}

